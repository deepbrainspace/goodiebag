pub mod commands;

use clap::{ Parser, Subcommand };

#[derive(Parser)]
#[command(name = "claude-code-toolkit")]
#[command(about = "Claude Code Toolkit for credential sync and session monitoring")]
#[command(version = env!("CARGO_PKG_VERSION"))]
pub struct Cli {
  #[command(subcommand)]
  pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
  /// Show Claude Code session and sync status
  Status,

  /// Show real-time session timer
  Timer,

  /// Run as daemon (used by systemd)
  Daemon,

  /// Organization management
  #[command(subcommand)]
  Org(OrgCommands),

  /// Repository management
  #[command(subcommand)]
  Repo(RepoCommands),

  /// Sync credentials to all configured targets (smart - only if changed)
  Sync {
    #[command(subcommand)]
    command: Option<SyncCommands>,
  },

  /// Service management
  #[command(subcommand)]
  Service(ServiceCommands),

  /// Interactive configuration wizard
  Configure,
}

#[derive(Subcommand)]
pub enum OrgCommands {
  /// Add a GitHub organization for credential sync
  Add {
    /// Organization name
    name: String,
  },

  /// Remove a GitHub organization
  Remove {
    /// Organization name
    name: String,
  },

  /// List configured organizations
  List,
}

#[derive(Subcommand)]
pub enum RepoCommands {
  /// Add a GitHub repository for credential sync (format: owner/repo)
  Add {
    /// Repository in format owner/repo
    repo: String,
  },

  /// Remove a GitHub repository
  Remove {
    /// Repository in format owner/repo
    repo: String,
  },

  /// List configured repositories
  List,
}

#[derive(Subcommand)]
pub enum SyncCommands {
  /// Force sync credentials to all targets (ignores change detection)
  Force,

  /// Show detailed sync status for all targets
  Status,

  /// Show daemon sync logs
  Logs {
    /// Number of lines to show
    #[arg(short, long, default_value = "50")]
    lines: usize,
  },
}

#[derive(Subcommand)]
pub enum ServiceCommands {
  /// Install and start the sync daemon
  Install,

  /// Stop and uninstall the sync daemon
  Uninstall {
    /// Keep configuration files
    #[arg(long)]
    keep_config: bool,
  },

  /// Start the sync daemon
  Start,

  /// Stop the sync daemon
  Stop,

  /// Restart the sync daemon
  Restart,

  /// Enable daemon auto-start on system boot
  Enable,

  /// Disable daemon auto-start
  Disable,
}
