use crate::{ config::manager::ConfigurationManager, error::*, providers::github::GitHubManager };
use console::{ Term, style };
use std::io::{ self, Write };

pub async fn handle_configure() -> Result<()> {
  let term = Term::stdout();
  term.clear_screen().ok();

  println!("{}", style("🛠️  Claude Code Configuration Wizard").bold().cyan());
  println!("{}", style("═".repeat(50)).dim());
  println!();
  println!("{}", style("This wizard will help you set up claude-code for automatic").dim());
  println!("{}", style("Claude credential synchronization to GitHub.").dim());
  println!();

  let config_manager = ConfigurationManager::new()?;
  let github_manager = GitHubManager::new();

  // Check prerequisites
  println!("{}", style("🔍 Checking prerequisites...").bold());

  if !github_manager.check_gh_cli().await? {
    println!("{}", style("❌ GitHub CLI (gh) not found. Please install it first:").red());
    println!("{}", style("   https://cli.github.com/").dim());
    return Ok(());
  }

  if !github_manager.check_authentication().await? {
    println!("{}", style("❌ GitHub CLI not authenticated. Please run:").red());
    println!("{}", style("   gh auth login").dim());
    return Ok(());
  }

  println!("{}", style("✅ GitHub CLI is available and authenticated").green());

  // Check Claude credentials
  let credentials_manager = crate::config::credentials::CredentialsManager::new()?;
  match credentials_manager.read_credentials().await {
    Ok(_) => println!("{}", style("✅ Claude credentials found").green()),
    Err(_) => {
      println!(
        "{}",
        style(
          "❌ Claude credentials not found. Please ensure Claude Code is installed and you're logged in."
        ).red()
      );
      return Ok(());
    }
  }

  println!();

  // Initialize config with defaults
  let mut config = config_manager.load_config().await.unwrap_or_default();

  // No longer configuring individual secret names here - handled by template system

  // Configure organizations
  println!("{}", style("🏢 Organization Configuration").bold().cyan());

  let available_orgs = github_manager.list_organizations().await?;
  if !available_orgs.is_empty() {
    println!("{}", style("Available organizations:").dim());
    for (i, org) in available_orgs.iter().enumerate() {
      println!("{}", style(format!("  {}. {}", i + 1, org)).dim());
    }
    println!();

    if prompt_yes_no("Would you like to add organizations for credential sync?")? {
      loop {
        let org_name = prompt("Organization name (or 'done' to finish)")?;
        if org_name.to_lowercase() == "done" {
          break;
        }

        if available_orgs.contains(&org_name) {
          config_manager.add_organization(org_name.clone()).await?;
          println!("{}", style(format!("✅ Added organization: {}", org_name)).green());
        } else {
          println!(
            "{}",
            style(
              format!("⚠️  Organization '{}' not found in your available organizations", org_name)
            ).yellow()
          );
          if prompt_yes_no("Add it anyway?")? {
            config_manager.add_organization(org_name.clone()).await?;
            println!("{}", style(format!("✅ Added organization: {}", org_name)).green());
          }
        }
      }
    }
  }

  println!();

  // Configure repositories
  println!("{}", style("📁 Repository Configuration").bold().cyan());

  if prompt_yes_no("Would you like to add repositories for credential sync?")? {
    loop {
      let repo = prompt("Repository (owner/repo format, or 'done' to finish)")?;
      if repo.to_lowercase() == "done" {
        break;
      }

      if repo.contains('/') {
        config_manager.add_repository(repo.clone()).await?;
        println!("{}", style(format!("✅ Added repository: {}", repo)).green());
      } else {
        println!(
          "{}",
          style("❌ Invalid format. Use owner/repo format (e.g., microsoft/vscode)").red()
        );
      }
    }
  }

  println!();

  // Secrets Configuration
  println!("{}", style("🔐 Secrets Configuration").bold().cyan());
  println!();
  println!(
    "{}",
    style("Secret mappings define which credential fields sync to which GitHub secrets.").dim()
  );
  println!("{}", style("You can configure these now or edit config.yml manually later.").dim());
  println!();

  if prompt_yes_no("Configure secret mappings now?")? {
    let mut mappings = std::collections::HashMap::new();

    println!("{}", style("Add credential field mappings:").bold());
    println!(
      "{}",
      style("Common fields: accessToken, refreshToken, expiresAt, subscriptionType, scopes").dim()
    );
    println!();

    loop {
      let field = prompt("Credential field name (or 'done' to finish)")?;
      if field.to_lowercase() == "done" {
        break;
      }
      let secret = prompt(&format!("GitHub secret name for '{}'", field))?;
      mappings.insert(field.clone(), secret.clone());
      println!("{}", style(format!("✅ Added mapping: {} → {}", field, secret)).green());
    }

    config.credentials.field_mappings = mappings;

    if !config.credentials.field_mappings.is_empty() {
      println!();
      println!("{}", style("✅ Secret mappings configured:").green());
      for (field, secret) in &config.credentials.field_mappings {
        println!("  {} → {}", style(field).cyan(), style(secret).yellow());
      }
    }
  } else {
    println!("{}", style("⚠️  No secret mappings configured.").yellow());
    println!(
      "{}",
      style("   Edit ~/.goodiebag/claude-code/config.yml to add mappings manually.").dim()
    );
    println!("{}", style("   See config-template.yml for examples.").dim());
  }

  println!();

  // Save config
  config_manager.save_config(&config).await?;

  // Daemon setup
  println!("{}", style("🤖 Daemon Configuration").bold().cyan());

  if prompt_yes_no("Would you like to install and start the sync daemon?")? {
    // Import and call service install logic
    crate::cli::commands::service::handle_install().await?;
  }

  println!();
  println!("{}", style("🎉 Configuration Complete!").bold().green());
  println!();
  println!("{}", style("Your claude-code is now configured. Here's what you can do next:").dim());
  println!();
  println!("{}", style("• View status:").bold());
  println!("{}", style("  claude-code status").dim());
  println!();
  println!("{}", style("• Manual sync:").bold());
  println!("{}", style("  claude-code sync now").dim());
  println!();
  println!("{}", style("• Real-time timer:").bold());
  println!("{}", style("  claude-code timer").dim());
  println!();
  println!("{}", style("• Configuration file:").bold());
  println!("{}", style(format!("  {}", config_manager.config_path().display())).dim());

  Ok(())
}

fn prompt(message: &str) -> Result<String> {
  print!("{}: ", style(message).bold());
  io::stdout().flush().unwrap();

  let mut input = String::new();
  io
    ::stdin()
    .read_line(&mut input)
    .map_err(|e| crate::error::ClaudeCodeError::Generic(e.to_string()))?;

  Ok(input.trim().to_string())
}

fn prompt_yes_no(message: &str) -> Result<bool> {
  loop {
    print!("{} [y/N]: ", style(message).bold());
    io::stdout().flush().unwrap();

    let mut input = String::new();
    io
      ::stdin()
      .read_line(&mut input)
      .map_err(|e| crate::error::ClaudeCodeError::Generic(e.to_string()))?;

    match input.trim().to_lowercase().as_str() {
      "y" | "yes" => {
        return Ok(true);
      }
      "n" | "no" | "" => {
        return Ok(false);
      }
      _ => println!("{}", style("Please enter 'y' for yes or 'n' for no").yellow()),
    }
  }
}
