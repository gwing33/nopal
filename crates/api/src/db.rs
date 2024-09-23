use once_cell::sync::Lazy;
use surrealdb::engine::any::Any;
use surrealdb::Surreal;

pub static DB: Lazy<Surreal<Any>> = Lazy::new(Surreal::init);
