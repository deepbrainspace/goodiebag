//! Configuration management system for Claude Code credentials and settings.
//!
//! This module provides a comprehensive configuration management system following
//! the Repository Pattern. It handles secure credential storage, YAML-based
//! configuration files, and runtime session information.
//!
//! ## Core Components
//!
//! - [`CredentialsManager`] - Secure credential storage and retrieval
//! - [`ConfigurationManager`] - Main configuration orchestrator
//! - [`YamlConfigProvider`] - YAML file-based configuration provider
//!
//! ## Usage Examples
//!
//! ### Basic Configuration Setup
//!
//! ```rust
//! use claude_code_toolkit::config::{ConfigurationManager, CredentialsManager};
//!
//! #[tokio::main]
//! async fn main() -> claude_code_toolkit::Result<()> {
//!     // Initialize configuration manager
//!     let config_manager = ConfigurationManager::new().await?;
//!     
//!     // Load configuration
//!     let config = config_manager.load_configuration().await?;
//!     println!("Loaded configuration with {} repositories", config.repositories.len());
//!     
//!     Ok(())
//! }
//! ```
//!
//! ### Credential Management
//!
//! ```rust
//! use claude_code_toolkit::config::CredentialsManager;
//!
//! #[tokio::main]
//! async fn main() -> claude_code_toolkit::Result<()> {
//!     let creds_manager = CredentialsManager::new().await?;
//!     
//!     // Check if credentials exist
//!     if creds_manager.credentials_exist().await? {
//!         let creds = creds_manager.read_credentials().await?;
//!         println!("Session expires: {:?}", creds.session_info.expires_at);
//!     }
//!     
//!     Ok(())
//! }
//! ```
//!
//! ## Security Features
//!
//! - Platform-specific secure credential storage
//! - Automatic permission setting on configuration files (600)
//! - Credential validation and expiration checking
//! - Secure credential file format with encryption support
//!
//! ## Configuration Structure
//!
//! The configuration system supports:
//! - GitHub organization and repository settings
//! - Sync intervals and retry policies
//! - Notification preferences
//! - Daemon service configuration
//! - Custom provider settings

pub mod credentials;
pub mod manager;

pub use credentials::CredentialsManager;
pub use manager::{ ConfigurationManager, YamlConfigProvider };
