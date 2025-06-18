use crate::error::*;
use dirs::home_dir;
use std::path::PathBuf;
use std::process::Stdio;
use tokio::fs;
use tokio::process::Command;
use tracing::{debug, info, warn};

const SERVICE_NAME: &str = "claude-code-sync.service";

pub struct SystemdManager {
    systemd_dir: PathBuf,
    service_file: PathBuf,
}

impl SystemdManager {
    pub fn new() -> Result<Self> {
        let systemd_dir = home_dir()
            .ok_or("Could not determine home directory")?
            .join(".config")
            .join("systemd")
            .join("user");

        let service_file = systemd_dir.join(SERVICE_NAME);

        Ok(Self {
            systemd_dir,
            service_file,
        })
    }

    pub async fn generate_service_file(&self) -> Result<String> {
        // Get the path to the current binary
        let current_exe = std::env::current_exe().map_err(|e| {
            ClaudeCodeError::Systemd(format!("Failed to get current executable: {}", e))
        })?;

        let service_content = format!(
            r#"[Unit]
Description=Claude Code Credential Sync Daemon
After=network.target

[Service]
Type=simple
ExecStart={} daemon
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=claude-code-sync

# Security settings
PrivateTmp=true
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=%h/.goodiebag/claude-code %h/.claude

[Install]
WantedBy=default.target"#,
            current_exe.display()
        );

        Ok(service_content)
    }

    pub async fn install(&self) -> Result<()> {
        // Ensure systemd user directory exists
        fs::create_dir_all(&self.systemd_dir).await?;

        // Generate and write service file
        let service_content = self.generate_service_file().await?;
        fs::write(&self.service_file, service_content).await?;

        // Reload systemd
        self.run_systemctl(&["daemon-reload"]).await?;

        // Enable and start the service
        self.run_systemctl(&["enable", SERVICE_NAME]).await?;
        self.run_systemctl(&["start", SERVICE_NAME]).await?;

        info!("Successfully installed and started systemd service");
        Ok(())
    }

    pub async fn uninstall(&self) -> Result<()> {
        // Stop and disable the service (ignore errors if not running/enabled)
        let _ = self.run_systemctl(&["stop", SERVICE_NAME]).await;
        let _ = self.run_systemctl(&["disable", SERVICE_NAME]).await;

        // Remove service file
        if self.service_file.exists() {
            fs::remove_file(&self.service_file).await?;
        }

        // Reload systemd
        self.run_systemctl(&["daemon-reload"]).await?;

        info!("Successfully uninstalled systemd service");
        Ok(())
    }

    pub async fn start(&self) -> Result<()> {
        self.run_systemctl(&["start", SERVICE_NAME]).await?;
        info!("Started systemd service");
        Ok(())
    }

    pub async fn stop(&self) -> Result<()> {
        self.run_systemctl(&["stop", SERVICE_NAME]).await?;
        info!("Stopped systemd service");
        Ok(())
    }

    pub async fn restart(&self) -> Result<()> {
        self.run_systemctl(&["restart", SERVICE_NAME]).await?;
        info!("Restarted systemd service");
        Ok(())
    }

    pub async fn enable(&self) -> Result<()> {
        self.run_systemctl(&["enable", SERVICE_NAME]).await?;
        info!("Enabled systemd service for auto-start");
        Ok(())
    }

    pub async fn disable(&self) -> Result<()> {
        self.run_systemctl(&["disable", SERVICE_NAME]).await?;
        info!("Disabled systemd service auto-start");
        Ok(())
    }

    pub async fn is_running(&self) -> Result<bool> {
        let output = Command::new("systemctl")
            .args(&["--user", "is-active", SERVICE_NAME])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.trim() == "active")
    }

    pub async fn status(&self) -> Result<String> {
        let output = Command::new("systemctl")
            .args(&["--user", "status", SERVICE_NAME])
            .output()
            .await?;

        // systemctl status returns non-zero exit code if service is not running
        if output.status.success() || !output.stdout.is_empty() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Ok("Service not found".to_string())
        }
    }

    pub async fn logs(&self, lines: usize) -> Result<String> {
        let output = Command::new("journalctl")
            .args(&[
                "--user",
                "-u",
                SERVICE_NAME,
                "-n",
                &lines.to_string(),
                "--no-pager",
            ])
            .output()
            .await?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            Err(ClaudeCodeError::Systemd(format!(
                "Failed to get logs: {}",
                error_msg
            )))
        }
    }

    async fn run_systemctl(&self, args: &[&str]) -> Result<()> {
        let mut cmd = Command::new("systemctl");
        cmd.arg("--user");
        cmd.args(args);

        let output = cmd.output().await?;

        if output.status.success() {
            debug!("systemctl command succeeded: {:?}", args);
            Ok(())
        } else {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            warn!("systemctl command failed: {:?}, error: {}", args, error_msg);
            Err(ClaudeCodeError::Systemd(format!(
                "systemctl command failed: {}",
                error_msg
            )))
        }
    }
}
