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
            if let Err(e) = read_serial_port_interactive("DK0HR7JK") {
                eprintln!("Error: {}", e);
            }
        }
    }
}

// These are the calibration values for the load cell
const COMPRESSION_10000_LBS: f64 = -1.9870;
const TENSION_10000_LBS: f64 = 1.9857;

fn read_serial_port_interactive(port_name: &str) -> Result<(), Box<dyn std::error::Error>> {
    // Find and open the serial port
    let ports = serialport::available_ports()?;
    let port = ports.iter().find(|p| p.port_name.contains(port_name));

    match port {
        Some(p) => {
            println!("Connected to {}", p.port_name);
            let mut port = serialport::new(p.port_name.clone(), 2_000_000)
                .timeout(Duration::from_millis(10))
                .open()?;

            let now = jiff::Timestamp::now();
            let filename = format!(
                "./data/load_cell_data_{}.csv",
                now.strftime("%Y-%m-%d_%H:%M").to_string()
            );
            let mut file = File::create(&filename)?;
            // Add header in
            writeln!(file, "Distance (in),Force (lbs)")?;

            loop {
                println!("Enter distance (or 'q' to quit): ");
                let mut input = String::new();
                io::stdin().read_line(&mut input)?;

                let input = input.trim();
                if input.to_lowercase().eq("q") {
                    break;
                }
                let distance = fraction_to_float(input);
                if let Err(e) = distance {
                    println!("Invalid distance: {}", e);
                    continue;
                }
                let distance = distance.unwrap();

                // Read the latest value from the serial port
                match read_single_measurement(&mut port) {
                    Ok((force, raw_value)) => {
                        println!(
                            "Distance: {}, Force: {}, Raw: {}",
                            distance, force, raw_value
                        );
                        // Write to file: distance,force
                        writeln!(file, "{},{}", distance, force)?;
                        file.flush()?;
                    }
                    Err(e) => {
                        println!("Error reading measurement: {}", e);
                    }
                }
            }
        }
        None => {
            eprintln!("Error: Port not found");
        }
    }

    Ok(())
}

fn read_single_measurement(
    port: &mut Box<dyn serialport::SerialPort>,
) -> Result<(f64, f64), Box<dyn std::error::Error>> {
    let mut serial_buf: Vec<u8> = vec![0; 1000];

    // Try to get a valid measurement for up to 1 second
    let start = std::time::Instant::now();
    while start.elapsed() < Duration::from_secs(1) {
        match port.read(serial_buf.as_mut_slice()) {
            Ok(t) => {
                let data = String::from_utf8_lossy(&serial_buf[..t]);
                for line in data.lines() {
                    if let Some(value) = line.trim().strip_suffix("mV/V") {
                        if let Ok(number) = value.parse::<f64>() {
                            let force = if number < 0.0 {
                                number * (10000.0 / COMPRESSION_10000_LBS)
                            } else {
                                number * (10000.0 / TENSION_10000_LBS)
                            };
                            return Ok((force, number));
                        }
                    }
                }
            }
            Err(ref e) if e.kind() == io::ErrorKind::TimedOut => continue,
            Err(e) => return Err(Box::new(e)),
        }
    }

    Err("Timeout waiting for measurement".into())
}

fn fraction_to_float(fraction_str: &str) -> Result<f64, Box<dyn std::error::Error>> {
    // Split the string by whitespace
    let parts: Vec<&str> = fraction_str.trim().split_whitespace().collect();

    let mut result = 0.0;

    match parts.len() {
        // Just a fraction like "1/2"
        1 => {
            if parts[0].contains('/') {
                let frac_parts: Vec<&str> = parts[0].split('/').collect();
                if frac_parts.len() == 2 {
                    let numerator: f64 = frac_parts[0].parse()?;
                    let denominator: f64 = frac_parts[1].parse()?;
                    result = numerator / denominator;
                }
            } else {
                // Just a whole number
                result = parts[0].parse()?;
            }
        }
        // Whole number and fraction like "1 1/2"
        2 => {
            let whole: f64 = parts[0].parse()?;
            let frac_parts: Vec<&str> = parts[1].split('/').collect();
            if frac_parts.len() == 2 {
                let numerator: f64 = frac_parts[0].parse()?;
                let denominator: f64 = frac_parts[1].parse()?;
                result = whole + (numerator / denominator);
            }
        }
        _ => return Err("Invalid fraction format".into()),
    }

    Ok(result)
}
