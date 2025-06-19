//! Configuration provider traits

use crate::error::Result;
use crate::types::Config;
use async_trait::async_trait;
use std::any::Any;
use std::path::Path;

/// Trait for configuration providers (YAML, JSON, environment, etc.)
#[async_trait]
pub trait ConfigProvider: Send + Sync {
  /// Load configuration from the provider
  async fn load_config(&self) -> Result<Config>;

  /// Save configuration to the provider
  async fn save_config(&self, config: &Config) -> Result<()>;

  /// Validate configuration format and structure
  async fn validate_config(&self, config: &Config) -> Result<()>;

  /// Check if configuration exists
  async fn config_exists(&self) -> Result<bool>;

  /// Get configuration file path (if applicable)
  fn config_path(&self) -> Option<&Path>;

  /// Downcasting support for concrete implementations
  fn as_any(&self) -> &dyn Any;
}

/// High-level configuration management interface
#[async_trait]
pub trait ConfigManager: Send + Sync {
  /// Initialize configuration with defaults
  async fn initialize(&self) -> Result<Config>;

  /// Load current configuration
  async fn load(&self) -> Result<Config>;

  /// Save configuration
  async fn save(&self, config: &Config) -> Result<()>;

  /// Update specific configuration section
  async fn update_section<T>(&self, section: &str, data: T) -> Result<()> where T: Send + Sync;

  /// Backup current configuration
  async fn backup(&self) -> Result<String>;

  /// Restore from backup
  async fn restore(&self, backup_id: &str) -> Result<()>;
}
