use crate::{ error::*, types::* };
use dirs::home_dir;
use std::path::PathBuf;
use tokio::fs;
use tracing::{ debug, warn };

pub struct CredentialsManager {
  credentials_path: PathBuf,
}

impl CredentialsManager {
  pub fn new() -> Result<Self> {
    // Default path for backward compatibility
    let credentials_path = home_dir()
      .ok_or("Could not determine home directory")?
      .join(".claude")
      .join(".credentials.json");

    Ok(Self { credentials_path })
  }

  pub fn with_path(path: PathBuf) -> Self {
    Self { credentials_path: path }
  }

  pub async fn read_credentials(&self) -> Result<ClaudeCredentials> {
    if !self.credentials_path.exists() {
      return Err(ClaudeCodeError::CredentialsNotFound {
        path: self.credentials_path.display().to_string(),
      });
    }

    let content = fs::read_to_string(&self.credentials_path).await?;
    let credentials: ClaudeCredentials = serde_json
      ::from_str(&content)
      .map_err(|e| ClaudeCodeError::InvalidCredentials(e.to_string()))?;

    debug!("Successfully read Claude credentials");
    Ok(credentials)
  }

  pub async fn get_access_token(&self) -> Result<String> {
    let credentials = self.read_credentials().await?;
    Ok(credentials.claude_ai_oauth.access_token)
  }

  pub async fn get_session_info(&self) -> Result<SessionInfo> {
    let credentials = self.read_credentials().await?;
    let oauth = credentials.claude_ai_oauth;
    let now = chrono::Utc::now().timestamp() * 1000; // Convert to milliseconds
    let time_remaining = oauth.expires_at - now;

    let session_info = SessionInfo {
      expires_at: oauth.expires_at,
      time_remaining,
      is_expired: time_remaining <= 0,
      subscription_type: oauth.subscription_type,
    };

    if session_info.is_expired {
      warn!("Claude session has expired");
    } else {
      debug!("Claude session expires in {}", Self::format_time_remaining(time_remaining));
    }

    Ok(session_info)
  }

  pub async fn get_expiry_time(&self) -> Result<i64> {
    let credentials = self.read_credentials().await?;
    Ok(credentials.claude_ai_oauth.expires_at)
  }

  pub fn format_time_remaining(milliseconds: i64) -> String {
    if milliseconds <= 0 {
      return "Expired".to_string();
    }

    let seconds = milliseconds / 1000;
    let minutes = seconds / 60;
    let hours = minutes / 60;
    let days = hours / 24;

    if days > 0 {
      format!("{}d {}h {}m", days, hours % 24, minutes % 60)
    } else if hours > 0 {
      format!("{}h {}m {}s", hours, minutes % 60, seconds % 60)
    } else if minutes > 0 {
      format!("{}m {}s", minutes, seconds % 60)
    } else {
      format!("{}s", seconds)
    }
  }

  pub fn credentials_path(&self) -> &std::path::Path {
    &self.credentials_path
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::io::Write;
  use tempfile::NamedTempFile;

  #[tokio::test]
  async fn test_format_time_remaining() {
    assert_eq!(CredentialsManager::format_time_remaining(-1), "Expired");
    assert_eq!(CredentialsManager::format_time_remaining(0), "Expired");
    assert_eq!(CredentialsManager::format_time_remaining(5000), "5s");
    assert_eq!(CredentialsManager::format_time_remaining(65000), "1m 5s");
    assert_eq!(CredentialsManager::format_time_remaining(3665000), "1h 1m 5s");
    assert_eq!(CredentialsManager::format_time_remaining(90065000), "1d 1h 1m");
  }

  #[tokio::test]
  async fn test_read_credentials_file_not_found() {
    let credentials_manager = CredentialsManager {
      credentials_path: PathBuf::from("/non/existent/path"),
    };

    let result = credentials_manager.read_credentials().await;
    assert!(result.is_err());
    match result.unwrap_err() {
      ClaudeCodeError::CredentialsNotFound { .. } => {}
      _ => panic!("Expected CredentialsNotFound error"),
    }
  }

  #[tokio::test]
  async fn test_read_valid_credentials() {
    let mut temp_file = NamedTempFile::new().unwrap();
    let credentials_json =
      r#"{
            "claudeAiOauth": {
                "accessToken": "test-access-token",
                "refreshToken": "test-refresh-token",
                "expiresAt": 1750255977327,
                "scopes": ["user:inference", "user:profile"],
                "subscriptionType": "max"
            }
        }"#;

    temp_file.write_all(credentials_json.as_bytes()).unwrap();

    let credentials_manager = CredentialsManager {
      credentials_path: temp_file.path().to_path_buf(),
    };

    let credentials = credentials_manager.read_credentials().await.unwrap();
    assert_eq!(credentials.claude_ai_oauth.access_token, "test-access-token");
    assert_eq!(credentials.claude_ai_oauth.refresh_token, "test-refresh-token");
    assert_eq!(credentials.claude_ai_oauth.expires_at, 1750255977327);
    assert_eq!(credentials.claude_ai_oauth.subscription_type, "max");
  }

  #[tokio::test]
  async fn test_invalid_credentials_format() {
    let mut temp_file = NamedTempFile::new().unwrap();
    temp_file.write_all(b"invalid json").unwrap();

    let credentials_manager = CredentialsManager {
      credentials_path: temp_file.path().to_path_buf(),
    };

    let result = credentials_manager.read_credentials().await;
    assert!(result.is_err());
    match result.unwrap_err() {
      ClaudeCodeError::InvalidCredentials(_) => {}
      _ => panic!("Expected InvalidCredentials error"),
    }
  }

  #[tokio::test]
  async fn test_get_session_info() {
    let mut temp_file = NamedTempFile::new().unwrap();
    let now = chrono::Utc::now().timestamp() * 1000;
    let future_time = now + 3600000; // 1 hour from now

    let credentials_json =
      format!(r#"{{
            "claudeAiOauth": {{
                "accessToken": "test-token",
                "refreshToken": "test-refresh",
                "expiresAt": {},
                "scopes": ["user:inference"],
                "subscriptionType": "max"
            }}
        }}"#, future_time);

    temp_file.write_all(credentials_json.as_bytes()).unwrap();

    let credentials_manager = CredentialsManager {
      credentials_path: temp_file.path().to_path_buf(),
    };

    let session_info = credentials_manager.get_session_info().await.unwrap();
    assert_eq!(session_info.expires_at, future_time);
    assert!(!session_info.is_expired);
    assert!(session_info.time_remaining > 0);
    assert_eq!(session_info.subscription_type, "max");
  }
}
