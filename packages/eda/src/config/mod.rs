use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EdaConfig {
    pub mode: EdaMode,
    pub database: DatabaseConfig,
    pub claude_projects_path: PathBuf,
    pub api_keys: ApiKeys,
    pub logging: LoggingConfig,
    pub remote: Option<RemoteConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub username: String,
    pub password: String,
    pub namespace: String,
    pub database: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKeys {
    pub anthropic_api_key: Option<String>,
    pub cloudflare_account_id: Option<String>,
    pub cloudflare_api_token: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum EdaMode {
    Local,      // Local MCP server + local SurrealDB
    Remote,     // MCP client → remote EDA server
    Hybrid,     // Local processing + optional remote sync
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteConfig {
    pub server_url: String,
    pub api_key: Option<String>,
    pub sync_enabled: bool,
}

impl Default for EdaConfig {
    fn default() -> Self {
        Self {
            mode: EdaMode::Local,
            database: DatabaseConfig::default(),
            claude_projects_path: dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".claude/projects"),
            api_keys: ApiKeys::default(),
            logging: LoggingConfig::default(),
            remote: None,
        }
    }
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            url: "ws://localhost:8000".to_string(),
            username: "root".to_string(),
            password: "root".to_string(),
            namespace: "eda".to_string(),
            database: "memory".to_string(),
        }
    }
}

impl Default for ApiKeys {
    fn default() -> Self {
        Self {
            anthropic_api_key: std::env::var("ANTHROPIC_API_KEY").ok(),
            cloudflare_account_id: std::env::var("CLOUDFLARE_ACCOUNT_ID").ok(),
            cloudflare_api_token: std::env::var("CLOUDFLARE_API_TOKEN").ok(),
        }
    }
}

impl Default for LoggingConfig {
    fn default() -> Self {
        Self {
            level: std::env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
        }
    }
}

impl EdaConfig {
    pub fn load() -> Result<Self> {
        // 1. Load .env file first (for secrets) - search multiple locations
        Self::load_env_file()?;
        
        // 2. Start with defaults
        let mut config = Self::default();
        
        // 3. Load from config.toml (non-sensitive settings)
        if let Ok(Some(toml_config)) = Self::load_config_file() {
            config.mode = toml_config.mode;
            config.claude_projects_path = toml_config.claude_projects_path;
            config.logging = toml_config.logging;
            config.remote = toml_config.remote;
            // Don't load database config from TOML - use env vars for connection strings
        }
        
        // 4. Override with environment variables (from .env)
        if let Ok(mode) = std::env::var("EDA_MODE") {
            config.mode = match mode.to_lowercase().as_str() {
                "local" => EdaMode::Local,
                "remote" => EdaMode::Remote,
                "hybrid" => EdaMode::Hybrid,
                _ => EdaMode::Local,
            };
        }
        
        // Database config from env vars only
        if let Ok(url) = std::env::var("SURREALDB_URL") {
            config.database.url = url;
        }
        if let Ok(user) = std::env::var("SURREALDB_USER") {
            config.database.username = user;
        }
        if let Ok(pass) = std::env::var("SURREALDB_PASS") {
            config.database.password = pass;
        }
        if let Ok(ns) = std::env::var("SURREALDB_NS") {
            config.database.namespace = ns;
        }
        if let Ok(db) = std::env::var("SURREALDB_DB") {
            config.database.database = db;
        }
        
        // API keys from env vars only
        config.api_keys.anthropic_api_key = std::env::var("ANTHROPIC_API_KEY").ok();
        config.api_keys.cloudflare_account_id = std::env::var("CLOUDFLARE_ACCOUNT_ID").ok();
        config.api_keys.cloudflare_api_token = std::env::var("CLOUDFLARE_API_TOKEN").ok();
        
        // Remote config from env vars
        if let Some(ref mut remote) = config.remote {
            if let Ok(server_url) = std::env::var("EDA_REMOTE_SERVER_URL") {
                remote.server_url = server_url;
            }
            if let Ok(api_key) = std::env::var("EDA_REMOTE_API_KEY") {
                remote.api_key = Some(api_key);
            }
        }
        
        // Paths
        if let Ok(path) = std::env::var("CLAUDE_PROJECTS_PATH") {
            config.claude_projects_path = PathBuf::from(shellexpand::tilde(&path).to_string());
        }
        
        Ok(config)
    }

    /// Load .env file from multiple possible locations
    fn load_env_file() -> Result<()> {
        let env_paths = vec![
            // 1. Current working directory (highest priority)
            std::env::current_dir()?.join(".env"),
            // 2. Package directory (if running from monorepo root)
            std::env::current_dir()?.join("packages/eda/.env"),
            // 3. User config directory
            dirs::config_dir().map(|d| d.join("eda/.env")).unwrap_or_else(|| PathBuf::from("~/.config/eda/.env")),
            // 4. Home directory
            dirs::home_dir().map(|d| d.join(".eda.env")).unwrap_or_else(|| PathBuf::from("~/.eda.env")),
        ];

        for env_path in env_paths {
            if env_path.exists() {
                tracing::info!("Loading .env from: {}", env_path.display());
                dotenv::from_path(&env_path).ok();
                return Ok(());
            }
        }

        tracing::debug!("No .env file found in search paths");
        Ok(())
    }

    /// Load config.toml from multiple possible locations
    fn load_config_file() -> Result<Option<EdaConfig>> {
        let config_paths = vec![
            // 1. Current working directory
            std::env::current_dir()?.join("config.toml"),
            // 2. Package directory
            std::env::current_dir()?.join("packages/eda/config.toml"),
            // 3. User config directory
            dirs::config_dir().map(|d| d.join("eda/config.toml")).unwrap_or_else(|| PathBuf::from("~/.config/eda/config.toml")),
        ];

        for config_path in config_paths {
            if config_path.exists() {
                tracing::info!("Loading config from: {}", config_path.display());
                let toml_str = std::fs::read_to_string(&config_path)?;
                let config = toml::from_str::<EdaConfig>(&toml_str)?;
                return Ok(Some(config));
            }
        }

        tracing::debug!("No config.toml found in search paths");
        Ok(None)
    }
}