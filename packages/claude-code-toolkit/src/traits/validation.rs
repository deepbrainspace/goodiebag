//! Validation traits and types

use super::Credentials;
use crate::error::Result;
use crate::types::Config;
use async_trait::async_trait;

/// Validation error details
#[derive(Debug, Clone)]
pub struct ValidationError {
    pub field: String,
    pub message: String,
    pub severity: ValidationSeverity,
    pub suggestion: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ValidationSeverity {
    Error,
    Warning,
    Info,
}

impl ValidationError {
    pub fn new(field: &str, message: &str, severity: ValidationSeverity) -> Self {
        Self {
            field: field.to_string(),
            message: message.to_string(),
            severity,
            suggestion: None,
        }
    }

    pub fn with_suggestion(mut self, suggestion: &str) -> Self {
        self.suggestion = Some(suggestion.to_string());
        self
    }

    pub fn error(field: &str, message: &str) -> Self {
        Self::new(field, message, ValidationSeverity::Error)
    }

    pub fn warning(field: &str, message: &str) -> Self {
        Self::new(field, message, ValidationSeverity::Warning)
    }

    pub fn info(field: &str, message: &str) -> Self {
        Self::new(field, message, ValidationSeverity::Info)
    }
}

/// Individual validation rule
#[async_trait]
pub trait ValidationRule: Send + Sync {
    /// Get rule identifier
    fn rule_id(&self) -> &str;

    /// Get rule description
    fn description(&self) -> &str;

    /// Validate configuration
    async fn validate_config(&self, config: &Config) -> Result<Vec<ValidationError>>;

    /// Validate credentials
    async fn validate_credentials(&self, credentials: &Credentials)
    -> Result<Vec<ValidationError>>;

    /// Check if rule applies to config
    fn applies_to(&self, _config: &Config) -> bool {
        true
    }
}

/// Validation service
#[async_trait]
pub trait ValidationService: Send + Sync {
    /// Register validation rule
    fn register_rule(&mut self, rule: Box<dyn ValidationRule>);

    /// Validate complete configuration
    async fn validate_config(&self, config: &Config) -> Result<Vec<ValidationError>>;

    /// Validate credentials
    async fn validate_credentials(&self, credentials: &Credentials)
    -> Result<Vec<ValidationError>>;

    /// Get validation summary
    async fn get_validation_summary(
        &self,
        config: &Config,
        credentials: Option<&Credentials>,
    ) -> Result<ValidationSummary>;

    /// Fix auto-fixable issues
    async fn auto_fix(&self, config: &mut Config) -> Result<Vec<String>>;
}

/// Summary of validation results
#[derive(Debug)]
pub struct ValidationSummary {
    pub total_issues: usize,
    pub errors: usize,
    pub warnings: usize,
    pub info: usize,
    pub auto_fixable: usize,
    pub is_valid: bool,
}

impl ValidationSummary {
    pub fn from_errors(errors: &[ValidationError]) -> Self {
        let errors_count = errors
            .iter()
            .filter(|e| e.severity == ValidationSeverity::Error)
            .count();
        let warnings_count = errors
            .iter()
            .filter(|e| e.severity == ValidationSeverity::Warning)
            .count();
        let info_count = errors
            .iter()
            .filter(|e| e.severity == ValidationSeverity::Info)
            .count();

        Self {
            total_issues: errors.len(),
            errors: errors_count,
            warnings: warnings_count,
            info: info_count,
            auto_fixable: 0, // Would need to implement auto-fix detection
            is_valid: errors_count == 0,
        }
    }
}
