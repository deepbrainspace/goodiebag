use crate::{
  config::manager::ConfigurationManager,
  error::*,
  sync::SyncService,
  utils::systemd::SystemdManager,
};
use console::{ Emoji, style };

static SYNC: Emoji<'_, '_> = Emoji("🔄 ", "");
static SUCCESS: Emoji<'_, '_> = Emoji("✅ ", "");
static FAILURE: Emoji<'_, '_> = Emoji("❌ ", "");
static INFO: Emoji<'_, '_> = Emoji("📊 ", "");
static LOGS: Emoji<'_, '_> = Emoji("📜 ", "");

pub async fn handle_sync_now() -> Result<()> {
  println!("{}Starting sync...", SYNC);

  let mut sync_service = SyncService::new_with_config().await?;

  match sync_service.check_and_sync_if_needed().await {
    Ok(()) => {
      println!("{}Sync operation completed", SUCCESS);
    }
    Err(e) => {
      eprintln!("{}Sync failed: {}", FAILURE, e);
      std::process::exit(1);
    }
  }

  Ok(())
}

pub async fn handle_sync_force() -> Result<()> {
  println!("{}Starting forced sync...", SYNC);

  let mut sync_service = SyncService::new_with_config().await?;

  match sync_service.force_sync().await {
    Ok(result) => {
      println!("{}Sync completed successfully", SUCCESS);
      println!("  Succeeded: {}, Failed: {}", result.succeeded, result.failed);
    }
    Err(e) => {
      eprintln!("{}Sync failed: {}", FAILURE, e);
      std::process::exit(1);
    }
  }

  Ok(())
}

pub async fn handle_sync_status() -> Result<()> {
  println!("{} {}", INFO, style("Sync Status").bold());
  println!();

  let config_manager = ConfigurationManager::new()?;
  let state = config_manager.load_state().await?;

  if state.last_sync == 0 {
    println!("Last Sync: {}", style("Never").yellow());
  } else {
    let last_sync = chrono::DateTime
      ::from_timestamp(state.last_sync, 0)
      .unwrap_or_default()
      .format("%Y-%m-%d %H:%M:%S UTC");
    let time_since_sync = chrono::Utc::now().timestamp() - state.last_sync;
    let minutes_ago = time_since_sync / 60;

    println!("Last Sync: {} ({} minutes ago)", last_sync, minutes_ago);
  }

  println!();

  if state.targets.is_empty() {
    println!("{}", style("No sync targets configured").yellow());
    println!(
      "{}",
      style("Use 'claude-code org add' or 'claude-code repo add' to add targets").dim()
    );
  } else {
    println!("{}", style("Target Status:").bold());
    println!();

    let success_count = state.targets
      .iter()
      .filter(|t| matches!(t.last_sync_status, crate::types::SyncStatus::Success))
      .count();
    let failure_count = state.targets.len() - success_count;

    println!("Total Targets: {}", state.targets.len());
    println!("Successful: {}", style(success_count.to_string()).green());
    println!("Failed: {}", style(failure_count.to_string()).red());

    println!();

    // Show individual target status
    for target in &state.targets {
      let icon = match target.last_sync_status {
        crate::types::SyncStatus::Success => SUCCESS,
        crate::types::SyncStatus::Failure => FAILURE,
      };

      let target_type = match target.target_type {
        crate::types::TargetType::Organization => "Organization",
        crate::types::TargetType::Repository => "Repository",
      };

      println!("{}{}: {}", icon, style(target_type).bold(), target.name);

      if target.last_sync_time > 0 {
        let sync_time = chrono::DateTime
          ::from_timestamp(target.last_sync_time, 0)
          .unwrap_or_default()
          .format("%Y-%m-%d %H:%M:%S UTC");
        println!("   Last Sync: {}", sync_time);
      }

      if let Some(ref error) = target.last_error {
        println!("   {}: {}", style("Error").red(), error);
      }

      println!();
    }
  }

  Ok(())
}

pub async fn handle_sync_logs(lines: usize) -> Result<()> {
  println!("{} {} (last {} lines)", LOGS, style("Daemon Logs").bold(), lines);
  println!();

  let systemd_manager = SystemdManager::new()?;

  match systemd_manager.logs(lines).await {
    Ok(logs) => {
      println!("{}", logs);
    }
    Err(e) => {
      eprintln!("{}Error retrieving logs: {}", FAILURE, e);
      std::process::exit(1);
    }
  }

  Ok(())
}
