use crate::account::models::User;
use crate::error::Result;

#[tonic::async_trait]
pub trait AccountRepository {
    async fn get_all_users(&self) -> Result<Vec<User>>;
    async fn me(&self) -> Result<User>;
    async fn sign_up(&self, name: &str, email: &str, password: &str) -> Result<User>;
    async fn login(&self, email: &str, password: &str) -> Result<User>;
}

pub struct SurrealAccountRepository {}

impl SurrealAccountRepository {
    pub fn new() -> Self {
        Self {}
    }
}

#[tonic::async_trait]
impl AccountRepository for SurrealAccountRepository {
    async fn get_all_users(&self) -> Result<Vec<User>> {
        todo!()
    }
    async fn me(&self) -> Result<User> {
        todo!()
    }

    async fn sign_up(&self, _name: &str, _email: &str, _password: &str) -> Result<User> {
        todo!()
    }

    async fn login(&self, _email: &str, _password: &str) -> Result<User> {
        todo!()
    }
}
