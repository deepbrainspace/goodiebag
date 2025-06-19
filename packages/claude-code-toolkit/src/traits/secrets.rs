//! Secret management traits

use super::{ Credentials, Secret, SyncResult, Target };
use crate::error::Result;
use async_trait::async_trait;
use std::collections::HashMap;

/// Trait for secret providers (GitHub, GitLab, Azure DevOps, etc.)
#[async_trait]
pub trait SecretProvider: Send + Sync {
  /// Get provider name
  fn provider_name(&self) -> &str;

  /// Sync secrets to targets
  async fn sync_secrets(&self, secrets: &[Secret], targets: &[Target]) -> Result<SyncResult>;

  /// Validate access to targets
  async fn validate_access(&self, targets: &[Target]) -> Result<HashMap<String, bool>>;

  /// List available targets (organizations, repositories, etc.)
  async fn list_targets(&self, target_type: &str) -> Result<Vec<String>>;

  /// Check if provider is properly configured
  async fn is_configured(&self) -> Result<bool>;
}

/// High-level secret management interface
#[async_trait]
pub trait SecretManager: Send + Sync {
  /// Register a secret provider
  fn register_provider(&mut self, provider: Box<dyn SecretProvider>);

  /// Get provider by name
  fn get_provider(&self, name: &str) -> Option<&dyn SecretProvider>;

  /// Sync credentials using specified mapping
  async fn sync_credentials(
    &self,
    credentials: &Credentials,
    mapping: &SecretMapping
  ) -> Result<SyncResult>;

  /// Sync credentials to specific targets
  async fn sync_credentials_to_targets(
    &self,
    credentials: &Credentials,
    mapping: &SecretMapping,
    targets: &[Target]
  ) -> Result<SyncResult>;

  /// Validate all configured targets
  async fn validate_targets(&self) -> Result<HashMap<String, bool>>;

  /// List all available providers
  fn list_providers(&self) -> Vec<&str>;
}

/// Mapping between credential fields and secret names
#[derive(Debug, Clone)]
pub struct SecretMapping {
  pub schema_name: String,
  pub mappings: HashMap<String, String>,
  pub templates: HashMap<String, String>,
}

impl SecretMapping {
  pub fn new(schema_name: &str) -> Self {
    Self {
      schema_name: schema_name.to_string(),
      mappings: HashMap::new(),
      templates: HashMap::new(),
    }
  }

  pub fn add_mapping(&mut self, field: &str, secret_name: &str) -> &mut Self {
    self.mappings.insert(field.to_string(), secret_name.to_string());
    self
  }

  pub fn get_secret_name(&self, field: &str) -> Option<&String> {
    self.mappings.get(field)
  }

  pub fn to_secrets(&self, credentials: &Credentials) -> Vec<Secret> {
    let mut secrets = Vec::new();

    // Debug the mappings
    tracing::debug!("SecretMapping has {} mappings: {:?}", self.mappings.len(), self.mappings);

    // Try both camelCase and snake_case field names for flexibility
    let access_token_name = self
      .get_secret_name("accessToken")
      .or_else(|| self.get_secret_name("access_token"));
    if let Some(name) = access_token_name {
      tracing::debug!("Found mapping for access token: {}", name);
      secrets.push(Secret {
        name: name.clone(),
        value: credentials.access_token.clone(),
        description: Some("Claude AI access token".to_string()),
      });
    } else {
      tracing::debug!("No mapping found for access token");
    }

    let refresh_token_name = self
      .get_secret_name("refreshToken")
      .or_else(|| self.get_secret_name("refresh_token"));
    if let (Some(token), Some(name)) = (&credentials.refresh_token, refresh_token_name) {
      tracing::debug!("Found mapping for refresh token: {}", name);
      secrets.push(Secret {
        name: name.clone(),
        value: token.clone(),
        description: Some("Claude AI refresh token".to_string()),
      });
    } else {
      tracing::debug!("No mapping found for refresh token or token is None");
    }

    let expires_at_name = self
      .get_secret_name("expiresAt")
      .or_else(|| self.get_secret_name("expires_at"));
    if let (Some(expires), Some(name)) = (credentials.expires_at, expires_at_name) {
      tracing::debug!("Found mapping for expires at: {}", name);
      secrets.push(Secret {
        name: name.clone(),
        value: expires.to_string(),
        description: Some("Claude AI token expiry timestamp".to_string()),
      });
    } else {
      tracing::debug!("No mapping found for expires at or expires_at is None");
    }

    tracing::debug!("Generated {} secrets from credentials", secrets.len());
    secrets
  }
}
