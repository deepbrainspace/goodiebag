//! Core traits for modular architecture

pub mod config;
pub mod secrets;
pub mod setup;
pub mod validation;

// Re-export commonly used traits
pub use config::{ConfigManager, ConfigProvider};
pub use secrets::{SecretManager, SecretMapping, SecretProvider};
pub use setup::{SetupContext, SetupStep, SetupWizard};
pub use validation::{ValidationError, ValidationRule, ValidationService};

use std::collections::HashMap;

/// Core credential types that all providers work with
#[derive(Debug, Clone)]
pub struct Credentials {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<i64>,
    pub metadata: HashMap<String, String>,
}

/// Generic target for secret synchronization
#[derive(Debug, Clone)]
pub struct Target {
    pub provider: String,
    pub target_type: String,
    pub name: String,
    pub config: HashMap<String, String>,
}

/// Result of a sync operation
#[derive(Debug, Clone)]
pub struct SyncResult {
    pub succeeded: usize,
    pub failed: usize,
    pub errors: Vec<String>,
}

/// Generic secret definition
#[derive(Debug, Clone)]
pub struct Secret {
    pub name: String,
    pub value: String,
    pub description: Option<String>,
}
