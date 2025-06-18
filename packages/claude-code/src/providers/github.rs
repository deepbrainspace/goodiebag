//! GitHub provider implementation following Repository Pattern

use super::{BaseProvider, ProviderCreator};
use crate::error::{ClaudeCodeError, Result};
use crate::traits::{Secret, SecretProvider, SyncResult, Target};
use async_trait::async_trait;
use std::collections::HashMap;
use std::process::Stdio;
use tokio::process::Command;
use tracing::{debug, error, info, warn};

/// GitHub CLI management utility
pub struct GitHubManager;

impl GitHubManager {
    pub fn new() -> Self {
        Self
    }

    /// Check if GitHub CLI is available
    pub async fn check_gh_cli(&self) -> Result<bool> {
        match Command::new("gh")
            .arg("--version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .await
        {
            Ok(status) => Ok(status.success()),
            Err(_) => Ok(false),
        }
    }

    /// Check if GitHub CLI is authenticated
    pub async fn check_authentication(&self) -> Result<bool> {
        match Command::new("gh")
            .args(["auth", "status"])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .await
        {
            Ok(status) => Ok(status.success()),
            Err(_) => Ok(false),
        }
    }

    /// List available organizations
    pub async fn list_organizations(&self) -> Result<Vec<String>> {
        let output = Command::new("gh")
            .args(["api", "user/orgs", "--jq", ".[].login"])
            .output()
            .await
            .map_err(|e| ClaudeCodeError::Process(format!("Failed to list organizations: {}", e)))?;

        if !output.status.success() {
            return Err(ClaudeCodeError::Process(
                "Failed to fetch organizations from GitHub".to_string(),
            ));
        }

        let organizations = String::from_utf8_lossy(&output.stdout)
            .lines()
            .map(|line| line.trim().to_string())
            .filter(|line| !line.is_empty())
            .collect();

        Ok(organizations)
    }
}

impl Default for GitHubManager {
    fn default() -> Self {
        Self::new()
    }
}

/// GitHub secret provider implementation
pub struct GitHubProvider {
    #[allow(dead_code)]
    base: BaseProvider,
}

impl GitHubProvider {
    pub fn new(config: HashMap<String, String>) -> Result<Self> {
        Ok(Self {
            base: BaseProvider::new("github", config),
        })
    }

    async fn execute_gh_command(&self, args: &[&str]) -> Result<std::process::Output> {
        let output = Command::new("gh").args(args).output().await.map_err(|e| {
            ClaudeCodeError::Process(format!("Failed to execute gh command: {}", e))
        })?;

        Ok(output)
    }

    async fn update_secret(&self, target: &Target, secret: &Secret) -> Result<()> {
        let args = match target.target_type.as_str() {
            "organization" => vec![
                "secret",
                "set",
                &secret.name,
                "--org",
                &target.name,
                "--body",
                &secret.value,
            ],
            "repository" => vec![
                "secret",
                "set",
                &secret.name,
                "--repo",
                &target.name,
                "--body",
                &secret.value,
            ],
            _ => {
                return Err(ClaudeCodeError::Generic(format!(
                    "Unsupported target type: {}",
                    target.target_type
                )));
            }
        };

        info!(
            "Updating secret {} for {} {}",
            secret.name, target.target_type, target.name
        );

        let output = self.execute_gh_command(&args).await?;

        if output.status.success() {
            info!(
                "Successfully updated secret {} for {} {}",
                secret.name, target.target_type, target.name
            );
            Ok(())
        } else {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            error!(
                "Failed to update secret for {} {}: {}",
                target.target_type, target.name, error_msg
            );
            Err(ClaudeCodeError::Process(format!(
                "Failed to update secret: {}",
                error_msg
            )))
        }
    }

    async fn check_target_access(&self, target: &Target) -> Result<bool> {
        let (api_path, args) = match target.target_type.as_str() {
            "organization" => {
                let path = format!("orgs/{}", target.name);
                (path, vec!["api"])
            }
            "repository" => {
                let path = format!("repos/{}", target.name);
                (path, vec!["api"])
            }
            _ => return Ok(false),
        };

        let mut full_args = args;
        full_args.push(&api_path);

        let output = self.execute_gh_command(&full_args).await?;
        Ok(output.status.success())
    }
}

#[async_trait]
impl SecretProvider for GitHubProvider {
    fn provider_name(&self) -> &str {
        "github"
    }

    async fn sync_secrets(&self, secrets: &[Secret], targets: &[Target]) -> Result<SyncResult> {
        let mut succeeded = 0;
        let mut failed = 0;
        let mut errors = Vec::new();

        for target in targets {
            if target.provider != self.provider_name() {
                continue; // Skip targets not for this provider
            }

            for secret in secrets {
                match self.update_secret(target, secret).await {
                    Ok(()) => succeeded += 1,
                    Err(e) => {
                        failed += 1;
                        errors.push(format!("{}:{} - {}", target.target_type, target.name, e));
                    }
                }
            }
        }

        Ok(SyncResult {
            succeeded,
            failed,
            errors,
        })
    }

    async fn validate_access(&self, targets: &[Target]) -> Result<HashMap<String, bool>> {
        let mut results = HashMap::new();

        for target in targets {
            if target.provider != self.provider_name() {
                continue;
            }

            let key = format!("{}:{}", target.target_type, target.name);
            let has_access = self.check_target_access(target).await.unwrap_or(false);
            results.insert(key, has_access);
        }

        Ok(results)
    }

    async fn list_targets(&self, target_type: &str) -> Result<Vec<String>> {
        let args = match target_type {
            "organization" => vec!["api", "user/orgs", "--jq", ".[].login"],
            "repository" => vec![
                "repo",
                "list",
                "--limit",
                "100",
                "--json",
                "nameWithOwner",
                "--jq",
                ".[].nameWithOwner",
            ],
            _ => {
                return Err(ClaudeCodeError::Generic(format!(
                    "Unsupported target type: {}",
                    target_type
                )));
            }
        };

        let output = self.execute_gh_command(&args).await?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let targets: Vec<String> = stdout
                .lines()
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string())
                .collect();

            debug!("Found {} {} targets", targets.len(), target_type);
            Ok(targets)
        } else {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            warn!("Failed to list {}: {}", target_type, error_msg);
            Ok(vec![]) // Return empty vec instead of error for better UX
        }
    }

    async fn is_configured(&self) -> Result<bool> {
        // Check if gh CLI is available and authenticated
        let version_output = self.execute_gh_command(&["--version"]).await?;
        if !version_output.status.success() {
            return Ok(false);
        }

        let auth_output = Command::new("gh")
            .args(["auth", "status"])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .await
            .map_err(|e| ClaudeCodeError::Process(e.to_string()))?;

        Ok(auth_output.success())
    }
}

/// GitHub provider creator for Factory Pattern
pub struct GitHubProviderCreator;

impl ProviderCreator for GitHubProviderCreator {
    fn create(&self, config: &HashMap<String, String>) -> Result<Box<dyn SecretProvider>> {
        let provider = GitHubProvider::new(config.clone())?;
        Ok(Box::new(provider))
    }

    fn provider_type(&self) -> &str {
        "github"
    }

    fn required_config(&self) -> Vec<&str> {
        vec![] // GitHub provider uses gh CLI, no additional config required
    }

    fn optional_config(&self) -> Vec<&str> {
        vec!["api_endpoint", "timeout", "retry_count"]
    }
}
