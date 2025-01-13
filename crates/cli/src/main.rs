use clap::{Parser, Subcommand}; // Args, ValueEnum
use jiff;
use serialport::SerialPortType;
use std::fs::File;
use std::io::Write;
use std::io::{self, Read};
use std::time::Duration;

#[derive(Debug, Subcommand)]
enum Command {
    Test {},
    RecordLoadCell {},
}

#[derive(Debug, Parser)]
#[command(name = "nopal")]
#[command(about = "Nopal CLI", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

fn main() {
    let args = Cli::parse();
    match args.command {
        Command::Test {} => {
            println!("Testing");
        }
        Command::RecordLoadCell {} => {
            println!("Recording load cell info");
            if let Err(e) = read_serial_port("DK0HR7JK") {
                eprintln!("Error: {}", e);
            }
        }
    }
}

// These are the calibration values for the load cell
const COMPRESSION_1000_LBS: f64 = -1.9870;
const TENSION_1000_LBS: f64 = 1.9857;

fn read_serial_port(port_name: &str) -> Result<(), Box<dyn std::error::Error>> {
    // List available ports
    let ports = serialport::available_ports()?;
    let mut port: Option<&serialport::SerialPortInfo> = None;

    // Find and print available ports
    println!("Available ports:");
    for p in &ports {
        if p.port_name.contains(port_name) {
            port = Some(p);
        }
    }

    match port {
        Some(p) => {
            println!("{}", p.port_name);
            if let SerialPortType::UsbPort(info) = &p.port_type {
                println!("  VID:{:04x} PID:{:04x}", info.vid, info.pid);
            }

            let mut port = serialport::new(p.port_name.clone(), 2_000_000)
                .timeout(Duration::from_millis(10))
                .open()?;

            let now = jiff::Timestamp::now();
            let filename = format!(
                "./data/load_cell_data_{}.txt",
                now.strftime("%Y-%m-%d_%H:%M").to_string()
            );
            let mut file = File::create(&filename)?;
            let mut serial_buf: Vec<u8> = vec![0; 1000];

            println!("Recording data (Ctrl+C to stop)...");

            loop {
                match port.read(serial_buf.as_mut_slice()) {
                    Ok(t) => {
                        let data = String::from_utf8_lossy(&serial_buf[..t]);

                        for line in data.lines() {
                            if let Some(value) = line.trim().strip_suffix("mV/V") {
                                match value.parse::<f64>() {
                                    Ok(number) => {
                                        let force = if number < 0.0 {
                                            let f = number * (1000.0 / COMPRESSION_1000_LBS);
                                            f
                                        } else {
                                            let f = number * (1000.0 / TENSION_1000_LBS);
                                            f
                                        };
                                        // number now contains the parsed float value
                                        println!("Force, number: {}, {}", force, number);

                                        // Still write the original data to file
                                        file.write_all(force.to_string().as_bytes())?;
                                        file.write_all(b"\n")?;
                                        file.flush()?;
                                    }
                                    Err(e) => {
                                        eprintln!("Error parsing number: {}", e);
                                    }
                                }
                            }
                        }
                    }
                    Err(ref e) if e.kind() == io::ErrorKind::TimedOut => continue,
                    Err(e) => {
                        eprintln!("Error: {}", e);
                        break;
                    }
                }
            }
        }
        None => {
            eprintln!("Error: Port not found");
            return Ok(());
        }
    }

    Ok(())
}
