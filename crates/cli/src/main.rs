use clap::{Parser, Subcommand}; // Args, ValueEnum

#[derive(Debug, Subcommand)]
enum Command {
    Test {},
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
    }
}
