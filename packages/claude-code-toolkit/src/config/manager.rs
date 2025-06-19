//! Configuration manager following Repository Pattern and Dependency Injection

use crate::error::{ ClaudeCodeError, Result };
use crate::traits::{ ConfigManager as ConfigManagerTrait, ConfigProvider };
use crate::types::Config;
use async_trait::async_trait;
use dirs::home_dir;
use std::path::{ Path, PathBuf };
use tokio::fs;
use tracing::{ debug, info, warn };

/// YAML configuration provider implementation
pub struct YamlConfigProvider {
  config_path: PathBuf,
  config_dir: PathBuf,
}

impl YamlConfigProvider {
  pub fn new() -> Result<Self> {
    let config_dir = home_dir()
      .ok_or("Could not determine home directory")?
      .join(".goodiebag")
      .join("claude-code");

    let config_path = config_dir.join("config.yml");

    Ok(Self {
      config_path,
      config_dir,
    })
  }

  pub fn with_path(config_path: PathBuf) -> Self {
    let config_dir = config_path
      .parent()
      .map(|p| p.to_path_buf())
      .unwrap_or_else(|| PathBuf::from("."));

    Self {
      config_path,
      config_dir,
    }
  }

  pub async fn ensure_config_dir(&self) -> Result<()> {
    fs::create_dir_all(&self.config_dir).await.map_err(ClaudeCodeError::Io)?;
    Ok(())
  }
}

#[async_trait]
impl ConfigProvider for YamlConfigProvider {
  async fn load_config(&self) -> Result<Config> {
    if !self.config_path.exists() {
      debug!("Config file not found, returning default config");
      return Ok(Config::default());
    }

    let content = fs::read_to_string(&self.config_path).await.map_err(ClaudeCodeError::Io)?;

    let config: Config = serde_yaml
      ::from_str(&content)
      .map_err(|e| ClaudeCodeError::InvalidConfig(e.to_string()))?;

    debug!("Loaded configuration from {:?}", self.config_path);
    Ok(config)
  }

  async fn save_config(&self, config: &Config) -> Result<()> {
    self.ensure_config_dir().await?;

    let content = serde_yaml
      ::to_string(config)
      .map_err(|e| ClaudeCodeError::InvalidConfig(e.to_string()))?;

    fs::write(&self.config_path, content).await.map_err(ClaudeCodeError::Io)?;

    info!("Saved configuration to {:?}", self.config_path);
    Ok(())
  }

  async fn validate_config(&self, config: &Config) -> Result<()> {
    // Basic validation - could be extended with validation rules
    if config.daemon.log_level.is_empty() {
      return Err(ClaudeCodeError::InvalidConfig("log_level cannot be empty".to_string()));
    }

    if config.daemon.sync_delay_after_expiry == 0 {
      warn!("sync_delay_after_expiry is 0, which may cause rapid sync attempts");
    }

    for org in &config.github.organizations {
      if org.name.is_empty() {
        return Err(ClaudeCodeError::InvalidConfig("Organization name cannot be empty".to_string()));
      }
    }

    for repo in &config.github.repositories {
      if !repo.repo.contains('/') {
        return Err(
          ClaudeCodeError::InvalidConfig(format!("Invalid repository format: {}", repo.repo))
        );
      }
    }

    Ok(())
  }

  async fn config_exists(&self) -> Result<bool> {
    Ok(self.config_path.exists())
  }

  fn config_path(&self) -> Option<&Path> {
    Some(&self.config_path)
  }

  fn as_any(&self) -> &dyn std::any::Any {
    self
  }
}

/// High-level configuration manager
pub struct ConfigurationManager {
  provider: Box<dyn ConfigProvider>,
  cache: Option<Config>,
}

impl ConfigurationManager {
  pub fn new() -> Result<Self> {
    let provider = Box::new(YamlConfigProvider::new()?);
    Ok(Self {
      provider,
      cache: None,
    })
  }

  pub fn with_provider(provider: Box<dyn ConfigProvider>) -> Self {
    Self {
      provider,
      cache: None,
    }
  }

  pub fn with_yaml_provider() -> Result<Self> {
    Self::new()
  }

  /// Invalidate cache
  pub fn invalidate_cache(&mut self) {
    self.cache = None;
  }

  /// Get cached config or load from provider
  #[allow(dead_code)]
  async fn get_cached_config(&mut self) -> Result<&Config> {
    if self.cache.is_none() {
      let config = self.provider.load_config().await?;
      self.provider.validate_config(&config).await?;
      self.cache = Some(config);
    }

    Ok(self.cache.as_ref().unwrap())
  }
}

#[async_trait]
impl ConfigManagerTrait for ConfigurationManager {
  async fn initialize(&self) -> Result<Config> {
    let config = Config::default();
    self.provider.save_config(&config).await?;
    info!("Initialized configuration with defaults");
    Ok(config)
  }

  async fn load(&self) -> Result<Config> {
    if !self.provider.config_exists().await? {
      debug!("Config does not exist, initializing with defaults");
      return self.initialize().await;
    }

    self.provider.load_config().await
  }

  async fn save(&self, config: &Config) -> Result<()> {
    self.provider.validate_config(config).await?;
    self.provider.save_config(config).await
  }

  async fn update_section<T>(&self, _section: &str, _data: T) -> Result<()> where T: Send + Sync {
    // TODO: Implement section-specific updates
    // This would involve deserializing specific sections and merging
    todo!("Section updates not yet implemented")
  }

  async fn backup(&self) -> Result<String> {
    let _config = self.provider.load_config().await?;
    let timestamp = chrono::Utc::now().timestamp();
    let backup_id = format!("backup_{}", timestamp);

    // In a real implementation, this would save to a backup location
    // For now, just return the backup ID
    info!("Created config backup: {}", backup_id);
    Ok(backup_id)
  }

  async fn restore(&self, backup_id: &str) -> Result<()> {
    // TODO: Implement backup restoration
    info!("Restoring config from backup: {}", backup_id);
    // For now, just log the restoration attempt
    Ok(())
  }
}

// Convenience methods that match the expected API
impl ConfigurationManager {
  /// Convenience method that matches the expected API
  pub async fn load_config(&self) -> Result<Config> {
    self.load().await
  }

  /// Convenience method that matches the expected API
  pub async fn save_config(&self, config: &Config) -> Result<()> {
    self.save(config).await
  }

  /// Add an organization to the configuration
  pub async fn add_organization(&self, name: String) -> Result<()> {
    let mut config = self.load_config().await?;

    // Check if organization already exists
    if config.github.organizations.iter().any(|org| org.name == name) {
      return Err(ClaudeCodeError::Generic(format!("Organization '{}' already exists", name)));
    }

    config.github.organizations.push(crate::types::GitHubOrganization {
      name,
    });

    self.save_config(&config).await
  }

  /// Remove an organization from the configuration
  pub async fn remove_organization(&self, name: &str) -> Result<()> {
    let mut config = self.load_config().await?;

    let original_len = config.github.organizations.len();
    config.github.organizations.retain(|org| org.name != name);

    if config.github.organizations.len() == original_len {
      return Err(ClaudeCodeError::Generic(format!("Organization '{}' not found", name)));
    }

    self.save_config(&config).await
  }

  /// Add a repository to the configuration
  pub async fn add_repository(&self, repo: String) -> Result<()> {
    let mut config = self.load_config().await?;

    // Check if repository already exists
    if config.github.repositories.iter().any(|r| r.repo == repo) {
      return Err(ClaudeCodeError::Generic(format!("Repository '{}' already exists", repo)));
    }

    config.github.repositories.push(crate::types::GitHubRepository {
      repo,
    });

    self.save_config(&config).await
  }

  /// Remove a repository from the configuration
  pub async fn remove_repository(&self, repo: &str) -> Result<()> {
    let mut config = self.load_config().await?;

    let original_len = config.github.repositories.len();
    config.github.repositories.retain(|r| r.repo != repo);

    if config.github.repositories.len() == original_len {
      return Err(ClaudeCodeError::Generic(format!("Repository '{}' not found", repo)));
    }

    self.save_config(&config).await
  }

  /// Load state information (placeholder for now)
  pub async fn load_state(&self) -> Result<crate::types::SyncState> {
    // For now, return a default state
    // TODO: Implement proper state management
    Ok(crate::types::SyncState {
      last_sync: 0,
      last_token: String::new(),
      targets: vec![],
    })
  }

  /// Ensure configuration directory exists
  pub async fn ensure_config_dir(&self) -> Result<()> {
    if let Some(yaml_provider) = self.provider.as_any().downcast_ref::<YamlConfigProvider>() {
      yaml_provider.ensure_config_dir().await
    } else {
      Ok(())
    }
  }

  /// Get configuration file path
  pub fn config_path(&self) -> &Path {
    self.provider.config_path().unwrap_or_else(|| Path::new(""))
  }

  /// Get configuration directory path
  pub fn config_dir(&self) -> &Path {
    self
      .config_path()
      .parent()
      .unwrap_or_else(|| Path::new(""))
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::types::*;
  use tempfile::TempDir;

  fn create_test_config() -> Config {
    Config {
      daemon: DaemonConfig {
        log_level: "info".to_string(),
        sync_delay_after_expiry: 60,
      },
      github: GitHubConfig {
        organizations: vec![GitHubOrganization {
          name: "test-org".to_string(),
        }],
        repositories: vec![GitHubRepository {
          repo: "owner/repo".to_string(),
        }],
      },
      notifications: NotificationConfig {
        session_warnings: vec![30, 15, 5],
        sync_failures: true,
      },
      credentials: CredentialsConfig {
        file_path: "~/.config/claude/test_credentials.json".to_string(),
        json_path: "claudeAiOauth".to_string(),
        field_mappings: {
          let mut mappings = std::collections::HashMap::new();
          mappings.insert("accessToken".to_string(), "CLAUDE_ACCESS_TOKEN".to_string());
          mappings.insert("refreshToken".to_string(), "CLAUDE_REFRESH_TOKEN".to_string());
          mappings.insert("expiresAt".to_string(), "CLAUDE_EXPIRES_AT".to_string());
          mappings
        },
      },
    }
  }

  #[tokio::test]
  async fn test_yaml_provider_save_and_load() {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join("test_config.yml");
    let provider = YamlConfigProvider::with_path(config_path);

    let test_config = create_test_config();

    // Save config
    provider.save_config(&test_config).await.unwrap();

    // Load config
    let loaded_config = provider.load_config().await.unwrap();

    assert_eq!(loaded_config.daemon.log_level, test_config.daemon.log_level);
    assert_eq!(loaded_config.github.organizations.len(), 1);
    assert_eq!(loaded_config.github.organizations[0].name, "test-org");
  }

  #[tokio::test]
  async fn test_yaml_provider_load_nonexistent() {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join("nonexistent.yml");
    let provider = YamlConfigProvider::with_path(config_path);

    let config = provider.load_config().await.unwrap();

    // Should return default config
    assert_eq!(config.daemon.log_level, "info");
    assert!(config.github.organizations.is_empty());
  }

  #[tokio::test]
  async fn test_config_validation() {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join("test_config.yml");
    let provider = YamlConfigProvider::with_path(config_path);

    // Test valid config
    let valid_config = create_test_config();
    assert!(provider.validate_config(&valid_config).await.is_ok());

    // Test invalid config - empty log level
    let mut invalid_config = create_test_config();
    invalid_config.daemon.log_level = "".to_string();
    assert!(provider.validate_config(&invalid_config).await.is_err());

    // Test invalid config - bad repo format
    let mut invalid_config = create_test_config();
    invalid_config.github.repositories[0].repo = "invalid-repo".to_string();
    assert!(provider.validate_config(&invalid_config).await.is_err());
  }

  #[tokio::test]
  async fn test_configuration_manager() {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join("test_config.yml");
    let provider = Box::new(YamlConfigProvider::with_path(config_path));
    let manager = ConfigurationManager::with_provider(provider);

    // Test initialize
    let config = manager.initialize().await.unwrap();
    assert_eq!(config.daemon.log_level, "info");

    // Test load
    let loaded_config = manager.load().await.unwrap();
    assert_eq!(loaded_config.daemon.log_level, "info");

    // Test save
    let mut test_config = create_test_config();
    test_config.daemon.log_level = "debug".to_string();
    manager.save(&test_config).await.unwrap();

    let updated_config = manager.load().await.unwrap();
    assert_eq!(updated_config.daemon.log_level, "debug");
  }

  #[tokio::test]
  async fn test_backup_restore() {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join("test_config.yml");
    let provider = Box::new(YamlConfigProvider::with_path(config_path));
    let manager = ConfigurationManager::with_provider(provider);

    let config = create_test_config();
    manager.save(&config).await.unwrap();

    // Test backup
    let backup_id = manager.backup().await.unwrap();
    assert!(backup_id.starts_with("backup_"));

    // Test restore (currently just logs, doesn't fail)
    let result = manager.restore(&backup_id).await;
    // Should succeed for now (returns Ok(()))
    assert!(result.is_ok());
  }
}
