//! Credential synchronization service following Service Pattern

use crate::config::{manager::ConfigurationManager, credentials::CredentialsManager};
use crate::traits::config::ConfigManager;
use crate::error::Result;
use crate::providers::registry::ProviderRegistry;
use crate::traits::{Credentials, SecretManager, SecretMapping, SyncResult};
use std::collections::HashMap;
use tracing::{error, info, warn};

/// High-level synchronization service
pub struct SyncService {
    credentials_manager: CredentialsManager,
    config_manager: ConfigurationManager,
    provider_registry: ProviderRegistry,
}

impl SyncService {
    pub fn new() -> Result<Self> {
        Ok(Self {
            credentials_manager: CredentialsManager::new()?,
            config_manager: ConfigurationManager::with_yaml_provider()?,
            provider_registry: ProviderRegistry::new(),
        })
    }

    /// Initialize providers from configuration
    pub async fn initialize(&mut self) -> Result<()> {
        let config = self.config_manager.load().await?;

        // Initialize GitHub provider if we have GitHub targets
        if !config.github.organizations.is_empty() || !config.github.repositories.is_empty() {
            let github_config = HashMap::new(); // GitHub provider uses gh CLI, no config needed
            match self
                .provider_registry
                .initialize_provider("github", github_config)
                .await
            {
                Ok(()) => info!("Initialized GitHub provider"),
                Err(e) => warn!("Failed to initialize GitHub provider: {}", e),
            }
        }

        Ok(())
    }

    /// Convert Claude credentials to our generic format
    async fn get_credentials(&self) -> Result<Credentials> {
        let claude_creds = self.credentials_manager.read_credentials().await?;

        let mut metadata = HashMap::new();
        metadata.insert(
            "subscription_type".to_string(),
            claude_creds.claude_ai_oauth.subscription_type.clone(),
        );

        Ok(Credentials {
            access_token: claude_creds.claude_ai_oauth.access_token,
            refresh_token: Some(claude_creds.claude_ai_oauth.refresh_token),
            expires_at: Some(claude_creds.claude_ai_oauth.expires_at),
            metadata,
        })
    }

    /// Create secret mapping from configuration
    async fn get_secret_mapping(&self) -> Result<SecretMapping> {
        let config = self.config_manager.load().await?;

        let mut mapping = SecretMapping::new("claude");
        mapping
            .add_mapping("access_token", &config.secrets.claude.access_token)
            .add_mapping("refresh_token", &config.secrets.claude.refresh_token)
            .add_mapping("expires_at", &config.secrets.claude.expires_at);

        Ok(mapping)
    }

    /// Perform complete credential synchronization
    pub async fn sync_all(&mut self) -> Result<SyncResult> {
        info!("Starting credential synchronization");

        // Initialize providers
        self.initialize().await?;

        // Get credentials and mapping
        let credentials = self.get_credentials().await?;
        let mapping = self.get_secret_mapping().await?;

        // Perform sync
        let result = self
            .provider_registry
            .sync_credentials(&credentials, &mapping)
            .await?;

        info!(
            "Sync completed: {} succeeded, {} failed",
            result.succeeded, result.failed
        );

        if !result.errors.is_empty() {
            for error in &result.errors {
                error!("Sync error: {}", error);
            }
        }

        Ok(result)
    }

    /// Force synchronization (ignore token change checks)
    pub async fn force_sync(&mut self) -> Result<SyncResult> {
        info!("Force syncing credentials");
        self.sync_all().await
    }

    /// Check if sync is needed and perform sync if required
    pub async fn check_and_sync_if_needed(&mut self) -> Result<()> {
        if self.is_sync_needed().await? {
            let result = self.sync_all().await?;
            if result.failed > 0 {
                warn!("Sync completed with {} failures", result.failed);
            } else {
                info!("Sync completed successfully: {} targets", result.succeeded);
            }
        }
        Ok(())
    }

    /// Check if sync is needed (token has changed)
    pub async fn is_sync_needed(&self) -> Result<bool> {
        // TODO: Implement token change detection
        // For now, always return true
        Ok(true)
    }

    /// Get sync status
    pub async fn get_sync_status(&self) -> Result<HashMap<String, bool>> {
        self.provider_registry.validate_targets().await
    }
}
