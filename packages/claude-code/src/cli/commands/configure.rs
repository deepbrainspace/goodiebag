use crate::{error::*, providers::github::GitHubManager, config::manager::ConfigurationManager};
use console::{Term, style};
use std::io::{self, Write};

pub async fn handle_configure() -> Result<()> {
    let term = Term::stdout();
    term.clear_screen().ok();

    println!(
        "{}",
        style("🛠️  Claude Code Configuration Wizard").bold().cyan()
    );
    println!("{}", style("═".repeat(50)).dim());
    println!();
    println!(
        "{}",
        style("This wizard will help you set up claude-code for automatic").dim()
    );
    println!(
        "{}",
        style("Claude credential synchronization to GitHub.").dim()
    );
    println!();

    let config_manager = ConfigurationManager::new()?;
    let github_manager = GitHubManager::new();

    // Check prerequisites
    println!("{}", style("🔍 Checking prerequisites...").bold());

    if !github_manager.check_gh_cli().await? {
        println!(
            "{}",
            style("❌ GitHub CLI (gh) not found. Please install it first:").red()
        );
        println!("{}", style("   https://cli.github.com/").dim());
        return Ok(());
    }

    if !github_manager.check_authentication().await? {
        println!(
            "{}",
            style("❌ GitHub CLI not authenticated. Please run:").red()
        );
        println!("{}", style("   gh auth login").dim());
        return Ok(());
    }

    println!(
        "{}",
        style("✅ GitHub CLI is available and authenticated").green()
    );

    // Check Claude credentials
    let credentials_manager = crate::config::credentials::CredentialsManager::new()?;
    match credentials_manager.read_credentials().await {
        Ok(_) => println!("{}", style("✅ Claude credentials found").green()),
        Err(_) => {
            println!("{}", style("❌ Claude credentials not found. Please ensure Claude Code is installed and you're logged in.").red());
            return Ok(());
        }
    }

    println!();

    // Initialize config with defaults
    let mut config = config_manager.load_config().await.unwrap_or_default();

    // Configure secret names
    println!("{}", style("⚙️  Secret Configuration").bold().cyan());
    println!(
        "{}",
        style("Configure the names of GitHub secrets to sync:").dim()
    );
    println!();

    config.secrets.claude.access_token = prompt_with_default(
        "Access Token Secret Name",
        &config.secrets.claude.access_token,
    )?;
    config.secrets.claude.refresh_token = prompt_with_default(
        "Refresh Token Secret Name",
        &config.secrets.claude.refresh_token,
    )?;
    config.secrets.claude.expires_at =
        prompt_with_default("Expires At Secret Name", &config.secrets.claude.expires_at)?;

    println!();

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
                    config_manager
                        .add_organization(org_name.clone(), "CLAUDE_CODE_TOKEN".to_string())
                        .await?;
                    println!(
                        "{}",
                        style(format!("✅ Added organization: {}", org_name)).green()
                    );
                } else {
                    println!(
                        "{}",
                        style(format!(
                            "⚠️  Organization '{}' not found in your available organizations",
                            org_name
                        ))
                        .yellow()
                    );
                    if prompt_yes_no("Add it anyway?")? {
                        config_manager
                            .add_organization(org_name.clone(), "CLAUDE_CODE_TOKEN".to_string())
                            .await?;
                        println!(
                            "{}",
                            style(format!("✅ Added organization: {}", org_name)).green()
                        );
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
                config_manager
                    .add_repository(repo.clone(), "CLAUDE_CODE_TOKEN".to_string())
                    .await?;
                println!(
                    "{}",
                    style(format!("✅ Added repository: {}", repo)).green()
                );
            } else {
                println!(
                    "{}",
                    style("❌ Invalid format. Use owner/repo format (e.g., microsoft/vscode)")
                        .red()
                );
            }
        }
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
    println!(
        "{}",
        style("Your claude-code is now configured. Here's what you can do next:").dim()
    );
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
    println!(
        "{}",
        style(format!("  {}", config_manager.config_path().display())).dim()
    );

    Ok(())
}

fn prompt(message: &str) -> Result<String> {
    print!("{}: ", style(message).bold());
    io::stdout().flush().unwrap();

    let mut input = String::new();
    io::stdin()
        .read_line(&mut input)
        .map_err(|e| crate::error::ClaudeCodeError::Generic(e.to_string()))?;

    Ok(input.trim().to_string())
}

fn prompt_with_default(message: &str, default: &str) -> Result<String> {
    print!("{} [{}]: ", style(message).bold(), style(default).dim());
    io::stdout().flush().unwrap();

    let mut input = String::new();
    io::stdin()
        .read_line(&mut input)
        .map_err(|e| crate::error::ClaudeCodeError::Generic(e.to_string()))?;

    let input = input.trim();
    if input.is_empty() {
        Ok(default.to_string())
    } else {
        Ok(input.to_string())
    }
}

fn prompt_yes_no(message: &str) -> Result<bool> {
    loop {
        print!("{} [y/N]: ", style(message).bold());
        io::stdout().flush().unwrap();

        let mut input = String::new();
        io::stdin()
            .read_line(&mut input)
            .map_err(|e| crate::error::ClaudeCodeError::Generic(e.to_string()))?;

        match input.trim().to_lowercase().as_str() {
            "y" | "yes" => return Ok(true),
            "n" | "no" | "" => return Ok(false),
            _ => println!(
                "{}",
                style("Please enter 'y' for yes or 'n' for no").yellow()
            ),
        }
    }
}
