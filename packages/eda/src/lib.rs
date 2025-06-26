//! Enhanced Dynamic Agent (EDA) - High-performance AI memory system for Claude Code
//! 
//! EDA learns from your coding conversations, discovers patterns, and provides intelligent
//! context to enhance your development workflow. Built in Rust for maximum performance
//! and minimal resource usage.

pub mod config;
pub mod types;

pub use config::EdaConfig;
pub use types::*;

/// EDA Result type for consistent error handling
pub type Result<T> = anyhow::Result<T>;

/// EDA Error types
#[derive(thiserror::Error, Debug)]
pub enum EdaError {
    #[error("Database error: {0}")]
    Database(String),
    
    #[error("File monitoring error: {0}")]
    FileMonitoring(String),
    
    #[error("Conversation parsing error: {0}")]
    Parsing(String),
    
    #[error("Embedding generation error: {0}")]
    Embedding(String),
    
    #[error("API error: {0}")]
    Api(String),
    
    #[error("Configuration error: {0}")]
    Config(String),
}