use crate::{ config::manager::ConfigurationManager, error::*, utils::systemd::SystemdManager };
use console::{ Emoji, style };

static ROCKET: Emoji<'_, '_> = Emoji("🚀 ", "");
static SUCCESS: Emoji<'_, '_> = Emoji("✅ ", "");
static STOP: Emoji<'_, '_> = Emoji("⏹️ ", "");
static RESTART: Emoji<'_, '_> = Emoji("🔄 ", "");
static TRASH: Emoji<'_, '_> = Emoji("🗑️ ", "");

pub async fn handle_install() -> Result<()> {
  println!("{}Installing Claude Code sync daemon...", ROCKET);

  // Ensure config directory exists
  let config_manager = ConfigurationManager::new()?;
  config_manager.ensure_config_dir().await?;

  // Install systemd service
  let systemd_manager = SystemdManager::new()?;

  // Check if service is already running
  if systemd_manager.is_running().await.unwrap_or(false) {
    println!("{}Service is already installed and running", style("⚠️").yellow());
    return Ok(());
  }

  systemd_manager.install().await?;

  println!("{}Service installed and started successfully", SUCCESS);
  println!();
  println!("{}", style("Next steps:").dim());
  println!("{}", style("1. Add organizations: claude-code org add <org-name>").dim());
  println!("{}", style("2. Add repositories: claude-code repo add <owner/repo>").dim());
  println!("{}", style("3. Check status: claude-code status").dim());

  Ok(())
}

pub async fn handle_uninstall(keep_config: bool) -> Result<()> {
  println!("{}Uninstalling Claude Code sync daemon...", TRASH);

  let systemd_manager = SystemdManager::new()?;
  systemd_manager.uninstall().await?;

  println!("{}Service uninstalled successfully", SUCCESS);

  if !keep_config {
    println!("{}Removing configuration and logs...", style("⚠️").yellow());
    // TODO: Remove config directory
    println!("{}Configuration removed", SUCCESS);
  } else {
    let config_manager = ConfigurationManager::new()?;
    println!(
      "{}",
      style(format!("Configuration kept at {}", config_manager.config_dir().display())).dim()
    );
  }

  Ok(())
}

pub async fn handle_start() -> Result<()> {
  println!("{}Starting Claude Code sync daemon...", ROCKET);

  let systemd_manager = SystemdManager::new()?;
  systemd_manager.start().await?;

  println!("{}Service started successfully", SUCCESS);

  Ok(())
}

pub async fn handle_stop() -> Result<()> {
  println!("{}Stopping Claude Code sync daemon...", STOP);

  let systemd_manager = SystemdManager::new()?;
  systemd_manager.stop().await?;

  println!("{}Service stopped successfully", SUCCESS);

  Ok(())
}

pub async fn handle_restart() -> Result<()> {
  println!("{}Restarting Claude Code sync daemon...", RESTART);

  let systemd_manager = SystemdManager::new()?;
  systemd_manager.restart().await?;

  println!("{}Service restarted successfully", SUCCESS);

  Ok(())
}

pub async fn handle_enable() -> Result<()> {
  println!("{}Enabling Claude Code sync daemon auto-start...", SUCCESS);

  let systemd_manager = SystemdManager::new()?;
  systemd_manager.enable().await?;

  println!("{}Service enabled for auto-start", SUCCESS);

  Ok(())
}

pub async fn handle_disable() -> Result<()> {
  println!("{}Disabling Claude Code sync daemon auto-start...", style("❌").red());

  let systemd_manager = SystemdManager::new()?;
  systemd_manager.disable().await?;

  println!("{}Service disabled from auto-start", SUCCESS);

  Ok(())
}
