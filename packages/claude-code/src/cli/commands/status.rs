use crate::{
    config::{manager::ConfigurationManager, credentials::CredentialsManager},
    error::*,
    utils::systemd::SystemdManager,
};
use console::{Emoji, style};

static CHECKMARK: Emoji<'_, '_> = Emoji("✅ ", "");
static CROSS: Emoji<'_, '_> = Emoji("❌ ", "");
static WARNING: Emoji<'_, '_> = Emoji("⚠️ ", "");
static INFO: Emoji<'_, '_> = Emoji("📊 ", "");

pub async fn handle_status() -> Result<()> {
    println!("{} {}", INFO, style("Claude Code Status").bold());
    println!();

    // Session info
    println!("{}", style("Session Information:").bold());
    match CredentialsManager::new() {
        Ok(credentials_manager) => match credentials_manager.get_session_info().await {
            Ok(session_info) => {
                println!(
                    "  Subscription: {}",
                    style(&session_info.subscription_type).cyan()
                );

                if session_info.is_expired {
                    println!("  Status: {}", style("Expired").red());
                } else {
                    println!("  Status: {}", style("Active").green());
                    println!(
                        "  Time Remaining: {}",
                        style(CredentialsManager::format_time_remaining(
                            session_info.time_remaining
                        ))
                        .yellow()
                    );
                }

                let expires_at =
                    chrono::DateTime::from_timestamp(session_info.expires_at / 1000, 0)
                        .unwrap_or_default()
                        .format("%Y-%m-%d %H:%M:%S UTC");
                println!("  Expires At: {}", expires_at);
            }
            Err(e) => {
                println!("  {}", style(format!("Error reading session: {}", e)).red());
            }
        },
        Err(e) => {
            println!(
                "  {}",
                style(format!("Error initializing credentials manager: {}", e)).red()
            );
        }
    }

    println!();

    // Daemon status
    println!("{}", style("Daemon Status:").bold());
    match SystemdManager::new() {
        Ok(systemd_manager) => match systemd_manager.is_running().await {
            Ok(is_running) => {
                if is_running {
                    println!("  Status: {}Running", CHECKMARK);
                } else {
                    println!("  Status: {}Stopped", CROSS);
                }
            }
            Err(e) => {
                println!("  Status: {}Error checking status: {}", WARNING, e);
            }
        },
        Err(e) => {
            println!(
                "  Status: {}Error initializing systemd manager: {}",
                WARNING, e
            );
        }
    }

    println!();

    // Sync status
    println!("{}", style("Sync Status:").bold());
    match ConfigurationManager::new() {
        Ok(config_manager) => {
            match config_manager.load_state().await {
                Ok(state) => {
                    if state.last_sync == 0 {
                        println!("  Last Sync: {}", style("Never").yellow());
                    } else {
                        let last_sync = chrono::DateTime::from_timestamp(state.last_sync, 0)
                            .unwrap_or_default()
                            .format("%Y-%m-%d %H:%M:%S UTC");
                        println!("  Last Sync: {}", last_sync);
                    }

                    if state.targets.is_empty() {
                        println!("  Targets: {}", style("None configured").yellow());
                    } else {
                        println!("  Targets: {} configured", state.targets.len());

                        // Show target status
                        for target in &state.targets {
                            let icon = match target.last_sync_status {
                                crate::types::SyncStatus::Success => CHECKMARK,
                                crate::types::SyncStatus::Failure => CROSS,
                            };
                            let target_name = format!("{}:{}", target.target_type, target.name);
                            println!("    {}{}", icon, target_name);

                            if let Some(ref error) = target.last_error {
                                println!("       {}", style(error).red());
                            }
                        }
                    }
                }
                Err(e) => {
                    println!(
                        "  {}",
                        style(format!("Error reading sync state: {}", e)).red()
                    );
                }
            }
        }
        Err(e) => {
            println!(
                "  {}",
                style(format!("Error initializing config manager: {}", e)).red()
            );
        }
    }

    println!();

    // Configuration
    println!("{}", style("Configuration:").bold());
    match ConfigurationManager::new() {
        Ok(config_manager) => match config_manager.load_config().await {
            Ok(config) => {
                println!("  Config Path: {}", config_manager.config_path().display());
                println!("  Organizations: {}", config.github.organizations.len());
                println!("  Repositories: {}", config.github.repositories.len());
                let total_targets =
                    config.github.organizations.len() + config.github.repositories.len();
                println!("  Total Targets: {}", total_targets);
            }
            Err(e) => {
                println!("  {}", style(format!("Error reading config: {}", e)).red());
            }
        },
        Err(e) => {
            println!(
                "  {}",
                style(format!("Error initializing config manager: {}", e)).red()
            );
        }
    }

    Ok(())
}
