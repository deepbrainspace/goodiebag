use thiserror::Error;

#[derive(Error, Debug)]
pub enum ClaudeCodeError {
  #[error("IO error: {0}")] Io(#[from] std::io::Error),

  #[error("JSON error: {0}")] Json(#[from] serde_json::Error),

  #[error("YAML error: {0}")] Yaml(#[from] serde_yaml::Error),

  #[error("Process execution error: {0}")] Process(String),

  #[error("HTTP error: {0}")] Http(#[from] reqwest::Error),

  #[error("Configuration error: {0}")] InvalidConfig(String),

  #[error("Provider error: {0}")] Provider(String),

  #[error("Validation error: {0}")] Validation(String),

  #[error("Setup error: {0}")] Setup(String),

  #[error("Credentials not found at {path}")] CredentialsNotFound {
    path: String,
  },

  #[error("Invalid credentials format: {0}")] InvalidCredentials(String),

  #[error("Time parsing error: {0}")] Time(#[from] chrono::ParseError),

  #[error("Notification error: {0}")] Notification(String),

  #[error("Systemd error: {0}")] Systemd(String),

  #[error("Daemon not running")]
  DaemonNotRunning,

  #[error("Daemon already running")]
  DaemonAlreadyRunning,

  #[error("Access denied")] AccessDenied {
    target_type: String,
    name: String,
  },

  #[error("Target not found")] TargetNotFound {
    target_type: String,
    name: String,
  },

  #[error("Invalid repository format: {repo}")] InvalidRepoFormat {
    repo: String,
  },

  #[error("Generic error: {0}")] Generic(String),
}

pub type Result<T> = std::result::Result<T, ClaudeCodeError>;

impl From<String> for ClaudeCodeError {
  fn from(s: String) -> Self {
    ClaudeCodeError::Generic(s)
  }
}

impl From<&str> for ClaudeCodeError {
  fn from(s: &str) -> Self {
    ClaudeCodeError::Generic(s.to_string())
  }
}
