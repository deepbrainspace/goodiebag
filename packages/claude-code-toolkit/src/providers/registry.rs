//! Provider registry following Service Locator Pattern

use super::ProviderFactory;
use crate::error::Result;
use crate::traits::{
  Credentials,
  SecretManager,
  SecretMapping,
  SecretProvider,
  SyncResult,
  Target,
};
use async_trait::async_trait;
use std::collections::HashMap;
use tracing::{ error, info, warn };

/// Service locator for secret providers
pub struct ProviderRegistry {
  factory: ProviderFactory,
  providers: HashMap<String, Box<dyn SecretProvider>>,
}

impl ProviderRegistry {
  pub fn new() -> Self {
    Self {
      factory: ProviderFactory::new(),
      providers: HashMap::new(),
    }
  }

  /// Initialize provider from configuration
  pub async fn initialize_provider(
    &mut self,
    name: &str,
    config: HashMap<String, String>
  ) -> Result<()> {
    let provider = self.factory.create(name, &config)?;

    // Validate provider configuration
    if !provider.is_configured().await? {
      warn!("Provider {} is not properly configured", name);
      return Err(
        crate::error::ClaudeCodeError::Generic(format!("Provider {} is not configured", name))
      );
    }

    info!("Initialized provider: {}", name);
    self.providers.insert(name.to_string(), provider);
    Ok(())
  }

  /// Get targets for all providers
  pub async fn get_all_targets(&self) -> Result<HashMap<String, Vec<Target>>> {
    let mut all_targets = HashMap::new();

    for (provider_name, provider) in &self.providers {
      let mut provider_targets = Vec::new();

      // Get organizations
      if let Ok(orgs) = provider.list_targets("organization").await {
        for org in orgs {
          provider_targets.push(Target {
            provider: provider_name.clone(),
            target_type: "organization".to_string(),
            name: org,
            config: HashMap::new(),
          });
        }
      }

      // Get repositories
      if let Ok(repos) = provider.list_targets("repository").await {
        for repo in repos {
          provider_targets.push(Target {
            provider: provider_name.clone(),
            target_type: "repository".to_string(),
            name: repo,
            config: HashMap::new(),
          });
        }
      }

      all_targets.insert(provider_name.clone(), provider_targets);
    }

    Ok(all_targets)
  }
}

impl Default for ProviderRegistry {
  fn default() -> Self {
    Self::new()
  }
}

#[async_trait]
impl SecretManager for ProviderRegistry {
  fn register_provider(&mut self, provider: Box<dyn SecretProvider>) {
    let name = provider.provider_name().to_string();
    info!("Registering provider: {}", name);
    self.providers.insert(name, provider);
  }

  fn get_provider(&self, name: &str) -> Option<&dyn SecretProvider> {
    self.providers.get(name).map(|p| p.as_ref())
  }

  async fn sync_credentials(
    &self,
    credentials: &Credentials,
    mapping: &SecretMapping
  ) -> Result<SyncResult> {
    // Empty targets for backward compatibility
    let targets = Vec::new();
    self.sync_credentials_to_targets(credentials, mapping, &targets).await
  }

  async fn sync_credentials_to_targets(
    &self,
    credentials: &Credentials,
    mapping: &SecretMapping,
    targets: &[Target]
  ) -> Result<SyncResult> {
    let secrets = mapping.to_secrets(credentials);
    let mut total_result = SyncResult {
      succeeded: 0,
      failed: 0,
      errors: Vec::new(),
    };

    for (provider_name, provider) in &self.providers {
      match provider.sync_secrets(&secrets, targets).await {
        Ok(result) => {
          total_result.succeeded += result.succeeded;
          total_result.failed += result.failed;
          total_result.errors.extend(result.errors);
        }
        Err(e) => {
          error!("Provider {} sync failed: {}", provider_name, e);
          total_result.failed += 1;
          total_result.errors.push(format!("Provider {}: {}", provider_name, e));
        }
      }
    }

    info!("Sync completed: {} succeeded, {} failed", total_result.succeeded, total_result.failed);

    Ok(total_result)
  }

  async fn validate_targets(&self) -> Result<HashMap<String, bool>> {
    let mut all_results = HashMap::new();

    for (provider_name, provider) in &self.providers {
      // TODO: Get targets from configuration
      let targets = Vec::new();

      match provider.validate_access(&targets).await {
        Ok(results) => {
          for (target, valid) in results {
            all_results.insert(format!("{}:{}", provider_name, target), valid);
          }
        }
        Err(e) => {
          warn!("Failed to validate targets for provider {}: {}", provider_name, e);
        }
      }
    }

    Ok(all_results)
  }

  fn list_providers(&self) -> Vec<&str> {
    self.providers
      .keys()
      .map(|s| s.as_str())
      .collect()
  }
}
