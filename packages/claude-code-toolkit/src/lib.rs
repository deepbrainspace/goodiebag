//! # Claude Code Toolkit
//!
//! A comprehensive Rust toolkit for managing Claude Code credentials, session monitoring,
//! and GitHub integration. This crate provides both a command-line interface and a library
//! for programmatic access to Claude Code functionality.
//!
//! ## Features
//!
//! - **Credential Management**: Secure storage and synchronization of Claude Code credentials
//! - **Session Monitoring**: Real-time tracking of Claude Code sessions with timer functionality
//! - **GitHub Integration**: Seamless sync with GitHub repositories and organizations
//! - **Daemon Mode**: Background service for automatic credential synchronization
//! - **Cross-Platform**: Primary support for Linux, with WSL support for Windows users
//! - **Systemd Integration**: Native systemd service support on Linux (optional feature)
//! - **Desktop Notifications**: Optional desktop notification support
//!
//! ## Quick Start
//!
//! ### Command Line Usage
//!
//! ```bash
//! # Install the daemon service
//! claude-code-toolkit service install
//!
//! # Add a GitHub organization for sync
//! claude-code-toolkit org add my-org
//!
//! # Add a specific repository
//! claude-code-toolkit repo add owner/repo
//!
//! # Sync credentials to all configured targets
//! claude-code-toolkit sync
//!
//! # Check status
//! claude-code-toolkit status
//! ```
//!
//! ### Library Usage
//!
//! ```rust
//! use claude_code_toolkit::{
//!     config::manager::ConfigurationManager,
//!     providers::github::GitHubProvider,
//!     sync::SyncManager,
//!     Result,
//! };
//!
//! #[tokio::main]
//! async fn main() -> Result<()> {
//!     // Initialize configuration
//!     let config_manager = ConfigurationManager::new().await?;
//!     
//!     // Set up GitHub provider
//!     let github_provider = GitHubProvider::new("your-token").await?;
//!     
//!     // Sync credentials
//!     let sync_manager = SyncManager::new(config_manager, github_provider).await?;
//!     sync_manager.sync_all().await?;
//!     
//!     Ok(())
//! }
//! ```
//!
//! ## Architecture
//!
//! The toolkit is organized into several key modules:
//!
//! - [`config`] - Configuration management and credential storage
//! - [`daemon`] - Background service functionality
//! - [`providers`] - Integration with external services (GitHub, etc.)
//! - [`sync`] - Credential synchronization logic
//! - [`cli`] - Command-line interface components
//! - [`utils`] - Utility functions and helpers
//!
//! ## Configuration
//!
//! The toolkit uses YAML-based configuration files stored in platform-appropriate
//! directories. Configuration includes:
//!
//! - GitHub API tokens and repository settings
//! - Sync intervals and retry policies
//! - Notification preferences
//! - Daemon service settings
//!
//! ## Security
//!
//! - Credentials are stored securely using platform-specific secure storage
//! - All API communications use HTTPS
//! - Sensitive data is never logged or exposed in error messages
//! - Configuration files have restrictive permissions
//!
//! ## Feature Flags
//!
//! - `systemd` (default): Enables systemd service integration on Linux
//! - `notifications` (default): Enables desktop notification support
//!
//! ## Platform Support
//!
//! | Platform | CLI | Sync | Daemon | Notes |
//! |----------|-----|------|--------|-------|
//! | 🐧 Linux | ✅ | ✅ | ✅ | Full support with systemd integration |
//! | 🪟 Windows (WSL) | ✅ | ✅ | ✅ | Requires WSL with systemd enabled |
//! | 🍎 macOS | ⚠️ | ❌ | ❌ | Credentials stored in Keychain (incompatible) |
//! | 🪟 Windows (Native) | ⚠️ | ❌ | ❌ | Credentials storage incompatible |
//!
//! **Feature Details**:
//! - **CLI**: All command-line operations (status, org/repo management, configure)
//! - **Sync**: Manual credential synchronization to GitHub targets
//! - **Daemon**: Background service for automatic synchronization
//!
//! **Important Notes**: 
//! - This toolkit expects Claude Code credentials to be stored as **files**, not in system keychains
//! - **Expected credential location**: `~/.claude/.credentials.json`
//! - **Linux and WSL** store credentials as files at this location, making them compatible
//! - **macOS and native Windows** store credentials in Keychain/Credential Manager respectively
//! - On incompatible platforms, credential reading will fail and sync operations won't work

pub mod cli;
pub mod config;
pub mod daemon;
pub mod error;
pub mod providers;
pub mod sync;
pub mod traits;
pub mod types;
pub mod utils;

pub use error::{ ClaudeCodeError, Result };
pub use traits::*;
