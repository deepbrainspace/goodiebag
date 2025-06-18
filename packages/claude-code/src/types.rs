use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeCredentials {
    #[serde(rename = "claudeAiOauth")]
    pub claude_ai_oauth: ClaudeOAuth,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeOAuth {
    #[serde(rename = "accessToken")]
    pub access_token: String,
    #[serde(rename = "refreshToken")]
    pub refresh_token: String,
    #[serde(rename = "expiresAt")]
    pub expires_at: i64,
    pub scopes: Vec<String>,
    #[serde(rename = "subscriptionType")]
    pub subscription_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub daemon: DaemonConfig,
    pub github: GitHubConfig,
    pub notifications: NotificationConfig,
    pub secrets: SecretsConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DaemonConfig {
    pub log_level: String,
    pub sync_delay_after_expiry: u64, // seconds
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubConfig {
    pub organizations: Vec<GitHubOrganization>,
    pub repositories: Vec<GitHubRepository>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubOrganization {
    pub name: String,
    pub secret_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubRepository {
    pub repo: String,
    pub secret_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationConfig {
    pub session_warnings: Vec<u64>, // minutes before expiry
    pub sync_failures: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecretsConfig {
    pub claude: ClaudeSecretsMapping,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeSecretsMapping {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SyncState {
    pub last_sync: i64,
    pub last_token: String,
    pub targets: Vec<TargetStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetStatus {
    pub target_type: TargetType,
    pub name: String,
    pub last_sync_time: i64,
    pub last_sync_status: SyncStatus,
    pub last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TargetType {
    Organization,
    Repository,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncStatus {
    Success,
    Failure,
}

#[derive(Debug, Clone)]
pub struct SessionInfo {
    pub expires_at: i64,
    pub time_remaining: i64,
    pub is_expired: bool,
    pub subscription_type: String,
}

#[derive(Debug, Clone)]
pub struct GitHubTarget {
    pub target_type: TargetType,
    pub name: String,
    pub secret_name: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            daemon: DaemonConfig {
                log_level: "info".to_string(),
                sync_delay_after_expiry: 60,
            },
            github: GitHubConfig {
                organizations: vec![],
                repositories: vec![],
            },
            notifications: NotificationConfig {
                session_warnings: vec![30, 15, 5],
                sync_failures: true,
            },
            secrets: SecretsConfig {
                claude: ClaudeSecretsMapping {
                    access_token: "CLAUDE_ACCESS_TOKEN".to_string(),
                    refresh_token: "CLAUDE_REFRESH_TOKEN".to_string(),
                    expires_at: "CLAUDE_EXPIRES_AT".to_string(),
                },
            },
        }
    }
}


impl std::fmt::Display for TargetType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TargetType::Organization => write!(f, "organization"),
            TargetType::Repository => write!(f, "repository"),
        }
    }
}

impl std::fmt::Display for SyncStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SyncStatus::Success => write!(f, "success"),
            SyncStatus::Failure => write!(f, "failure"),
        }
    }
}
