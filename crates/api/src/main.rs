use anyhow::Result;
use nopal_api::account::{AccountService, SurrealAccountRepository};
use nopal_api::db::DB;
use nopal_api::services::proto::account::account_server::AccountServer;
use nopal_api::services::FILE_DESCRIPTOR_SET;
use tonic::transport::Server;
use tracing::info;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv()?;
    setup_tracing_registry();

    // Setup DB Connection
    DB.connect("ws://localhost:8000").await?;
    DB.use_ns("nopal").await?;
    DB.use_db("account").await?;

    let reflection_service = tonic_reflection::server::Builder::configure()
        .register_encoded_file_descriptor_set(FILE_DESCRIPTOR_SET)
        .build()?;
    let account_service = AccountServer::new(build_account_service());

    let address = "0.0.0.0:8080".parse()?;
    info!("Service is listening on {address}");

    Server::builder()
        .add_service(reflection_service)
        .add_service(account_service)
        .serve(address)
        .await?;

    Ok(())
}

fn build_account_service() -> AccountService<SurrealAccountRepository> {
    let repository = SurrealAccountRepository::new();
    AccountService::new(repository)
}

fn setup_tracing_registry() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,trading_api=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer().pretty())
        .init();
}
