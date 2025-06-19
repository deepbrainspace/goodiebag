//! Provider implementations following Repository Pattern and Dependency Injection

pub mod github;
pub mod registry;

use crate::error::Result;
use crate::traits::SecretProvider;
use std::collections::HashMap;

/// Provider factory following Factory Pattern
pub struct ProviderFactory {
  creators: HashMap<String, Box<dyn ProviderCreator>>,
}

impl ProviderFactory {
  pub fn new() -> Self {
    let mut factory = Self {
      creators: HashMap::new(),
    };

    // Register built-in providers
    factory.register("github", Box::new(github::GitHubProviderCreator));

    factory
  }

  pub fn register(&mut self, name: &str, creator: Box<dyn ProviderCreator>) {
    self.creators.insert(name.to_string(), creator);
  }

  pub fn create(
    &self,
    name: &str,
    config: &HashMap<String, String>
  ) -> Result<Box<dyn SecretProvider>> {
    let creator = self.creators
      .get(name)
      .ok_or_else(|| {
        crate::error::ClaudeCodeError::Generic(format!("Unknown provider: {}", name))
      })?;

    creator.create(config)
  }

  pub fn available_providers(&self) -> Vec<&str> {
    self.creators
      .keys()
      .map(|s| s.as_str())
      .collect()
  }
}

impl Default for ProviderFactory {
  fn default() -> Self {
    Self::new()
  }
}

/// Provider creator trait for Factory Pattern
pub trait ProviderCreator: Send + Sync {
  fn create(&self, config: &HashMap<String, String>) -> Result<Box<dyn SecretProvider>>;
  fn provider_type(&self) -> &str;
  fn required_config(&self) -> Vec<&str>;
  fn optional_config(&self) -> Vec<&str> {
    Vec::new()
  }
}

/// Base provider implementation with common functionality
pub struct BaseProvider {
  pub name: String,
  pub config: HashMap<String, String>,
}

impl BaseProvider {
  pub fn new(name: &str, config: HashMap<String, String>) -> Self {
    Self {
      name: name.to_string(),
      config,
    }
  }

  pub fn get_config(&self, key: &str) -> Option<&String> {
    self.config.get(key)
  }

  pub fn require_config(&self, key: &str) -> Result<&String> {
    self
      .get_config(key)
      .ok_or_else(|| {
        crate::error::ClaudeCodeError::Generic(format!("Missing required config: {}", key))
      })
  }
}
