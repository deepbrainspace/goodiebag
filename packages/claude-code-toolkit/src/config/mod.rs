//! Configuration management following Repository Pattern

pub mod credentials;
pub mod manager;

pub use credentials::CredentialsManager;
pub use manager::{ConfigurationManager, YamlConfigProvider};
