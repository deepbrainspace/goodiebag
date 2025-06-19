use clap::Parser;
use claude_code::{
  cli::{ Cli, Commands, OrgCommands, RepoCommands, ServiceCommands, SyncCommands, commands },
  daemon::Daemon,
  error::Result,
};
use console::style;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<()> {
  // Initialize logging
  let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_|
    EnvFilter::new("claude_code=info")
  );

  tracing_subscriber::fmt().with_env_filter(filter).with_target(false).init();

  let cli = Cli::parse();

  // Handle commands
  let result = match cli.command {
    Commands::Status => commands::status::handle_status().await,
    Commands::Timer => commands::timer::handle_timer().await,
    Commands::Daemon => {
      let mut daemon = Daemon::new_with_config().await?;
      daemon.start().await
    }
    Commands::Org(org_cmd) =>
      match org_cmd {
        OrgCommands::Add { name } => { commands::org::handle_add_org(name).await }
        OrgCommands::Remove { name } => commands::org::handle_remove_org(name).await,
        OrgCommands::List => commands::org::handle_list_orgs().await,
      }
    Commands::Repo(repo_cmd) =>
      match repo_cmd {
        RepoCommands::Add { repo } => { commands::repo::handle_add_repo(repo).await }
        RepoCommands::Remove { repo } => commands::repo::handle_remove_repo(repo).await,
        RepoCommands::List => commands::repo::handle_list_repos().await,
      }
    Commands::Sync { command } =>
      match command {
        Some(SyncCommands::Force) => commands::sync::handle_sync_force().await,
        Some(SyncCommands::Status) => commands::sync::handle_sync_status().await,
        Some(SyncCommands::Logs { lines }) => commands::sync::handle_sync_logs(lines).await,
        None => commands::sync::handle_sync_now().await, // Default smart sync
      }
    Commands::Service(service_cmd) =>
      match service_cmd {
        ServiceCommands::Install => commands::service::handle_install().await,
        ServiceCommands::Uninstall { keep_config } => {
          commands::service::handle_uninstall(keep_config).await
        }
        ServiceCommands::Start => commands::service::handle_start().await,
        ServiceCommands::Stop => commands::service::handle_stop().await,
        ServiceCommands::Restart => commands::service::handle_restart().await,
        ServiceCommands::Enable => commands::service::handle_enable().await,
        ServiceCommands::Disable => commands::service::handle_disable().await,
      }
    Commands::Configure => commands::configure::handle_configure().await,
  };

  // Handle errors gracefully
  if let Err(e) = result {
    eprintln!("{}: {}", style("Error").red().bold(), e);
    std::process::exit(1);
  }

  Ok(())
}
