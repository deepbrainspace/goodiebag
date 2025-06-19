pub mod systemd;

#[cfg(feature = "notifications")]
pub mod notifications {
  use crate::error::*;
  use notify_rust::Notification;
  use tracing::warn;

  pub fn send_session_warning(minutes_remaining: u64) -> Result<()> {
    let title = "Claude Code Session Warning";
    let body = format!("Your Claude session expires in {} minutes", minutes_remaining);

    match
      Notification::new()
        .summary(title)
        .body(&body)
        .icon("dialog-warning")
        .timeout(5000) // 5 seconds
        .show()
    {
      Ok(_) => Ok(()),
      Err(e) => {
        warn!("Failed to send notification: {}", e);
        Err(ClaudeCodeError::Notification(e.to_string()))
      }
    }
  }

  pub fn send_sync_failure(target: &str, error: &str) -> Result<()> {
    let title = "Claude Code Sync Failed";
    let body = format!("Failed to sync to {}: {}", target, error);

    match
      Notification::new()
        .summary(title)
        .body(&body)
        .icon("dialog-error")
        .timeout(10000) // 10 seconds
        .show()
    {
      Ok(_) => Ok(()),
      Err(e) => {
        warn!("Failed to send notification: {}", e);
        Err(ClaudeCodeError::Notification(e.to_string()))
      }
    }
  }

  pub fn send_sync_success(count: usize) -> Result<()> {
    let title = "Claude Code Sync Success";
    let body = format!("Successfully synced credentials to {} targets", count);

    match
      Notification::new()
        .summary(title)
        .body(&body)
        .icon("dialog-information")
        .timeout(3000) // 3 seconds
        .show()
    {
      Ok(_) => Ok(()),
      Err(e) => {
        warn!("Failed to send notification: {}", e);
        Err(ClaudeCodeError::Notification(e.to_string()))
      }
    }
  }
}

#[cfg(not(feature = "notifications"))]
pub mod notifications {
  use crate::error::*;

  pub fn send_session_warning(_minutes_remaining: u64) -> Result<()> {
    Ok(())
  }

  pub fn send_sync_failure(_target: &str, _error: &str) -> Result<()> {
    Ok(())
  }

  pub fn send_sync_success(_count: usize) -> Result<()> {
    Ok(())
  }
}
