use tonic::{Request, Response, Status};

use crate::account::models::User as UserModel;
use crate::account::repository::AccountRepository;
use crate::services::proto::account::account_server::Account;
use crate::services::proto::account::{User, Users};

pub struct AccountService<R> {
    repository: R,
}

impl<R> AccountService<R> {
    pub fn new(repository: R) -> Self {
        Self { repository }
    }
}

#[tonic::async_trait]
impl<R> Account for AccountService<R>
where
    R: AccountRepository + Send + Sync + 'static,
{
    async fn all_users(&self, _request: Request<()>) -> Result<Response<Users>, Status> {
        let users = self
            .repository
            .get_all_users()
            .await?
            .into_iter()
            .map(Into::into)
            .collect();

        Ok(Response::new(Users { users }))
    }

    async fn me(&self, _request: Request<()>) -> Result<Response<User>, Status> {
        let user = self.repository.me().await?;

        Ok(Response::new(user.into()))
    }

    async fn sign_up(&self, request: Request<User>) -> Result<Response<()>, Status> {
        let user = request.get_ref();
        self.repository
            .sign_up(&user.name, &user.email, &user.password)
            .await?;

        Ok(Response::new(()))
    }

    async fn login(&self, request: Request<User>) -> Result<Response<()>, Status> {
        let user = request.get_ref();
        self.repository.login(&user.email, &user.password).await?;

        Ok(Response::new(()))
    }
}

impl From<UserModel> for User {
    fn from(user: UserModel) -> Self {
        User {
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
        }
    }
}
