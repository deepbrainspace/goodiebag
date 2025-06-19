use crate::{error::*, providers::github::GitHubManager, config::manager::ConfigurationManager};
use console::{Emoji, style};

static SUCCESS: Emoji<'_, '_> = Emoji("✅ ", "");
#[allow(dead_code)]
static WARNING: Emoji<'_, '_> = Emoji("⚠️ ", "");
static INFO: Emoji<'_, '_> = Emoji("ℹ️ ", "");

pub async fn handle_add_org(name: String) -> Result<()> {
    println!(
        "{}Adding organization {} for Claude secret sync",
        INFO,
        style(&name).bold()
    );

    // Verify GitHub access
    let github_manager = GitHubManager::new();

    if !github_manager.check_gh_cli().await? {
        eprintln!(
            "{}",
            style("GitHub CLI (gh) is not installed. Please install it first.").red()
        );
        std::process::exit(1);
    }

    if !github_manager.check_authentication().await? {
        eprintln!(
            "{}",
            style("GitHub CLI is not authenticated. Please run 'gh auth login' first.").red()
        );
        std::process::exit(1);
    }

    // Add to config
    let config_manager = ConfigurationManager::new()?;
    config_manager
        .add_organization(name.clone())
        .await?;

    println!(
        "{}Successfully added organization {}",
        SUCCESS,
        style(&name).bold()
    );
    // Show which secrets will be synced from config
    let config = config_manager.load_config().await?;
    let secret_names: Vec<String> = config.credentials.field_mappings.values().cloned().collect();
    println!(
        "{}",
        style(format!("Will sync: {}", secret_names.join(", "))).dim()
    );
    println!(
        "{}",
        style("Run 'claude-code sync now' to sync immediately").dim()
    );

    Ok(())
}

pub async fn handle_remove_org(name: String) -> Result<()> {
    println!("{}Removing organization {}", INFO, style(&name).bold());

    let config_manager = ConfigurationManager::new()?;
    config_manager.remove_organization(&name).await?;

    println!(
        "{}Successfully removed organization {}",
        SUCCESS,
        style(&name).bold()
    );

    Ok(())
}

pub async fn handle_list_orgs() -> Result<()> {
    let config_manager = ConfigurationManager::new()?;
    let config = config_manager.load_config().await?;

    if config.github.organizations.is_empty() {
        println!("{}", style("No organizations configured").yellow());
        println!(
            "{}",
            style("Use 'claude-code org add <name>' to add an organization").dim()
        );
        return Ok(());
    }

    println!("{}", style("Configured Organizations:").bold());
    println!();

    for org in &config.github.organizations {
        println!("  {}", style(&org.name).cyan());
        let secret_names: Vec<String> = config.credentials.field_mappings.values().cloned().collect();
        println!("    Secrets: {}", style(secret_names.join(", ")).dim());
    }

    println!();

    // Show available organizations from GitHub
    println!("{}", style("Available Organizations from GitHub:").bold());
    println!();

    let github_manager = GitHubManager::new();

    match github_manager.list_organizations().await {
        Ok(available_orgs) => {
            if available_orgs.is_empty() {
                println!("  {}", style("No organizations found").dim());
            } else {
                for org in available_orgs {
                    let is_configured = config.github.organizations.iter().any(|o| o.name == org);
                    if is_configured {
                        println!("  {} {}", style("✓").green(), org);
                    } else {
                        println!("  {} {}", style("○").dim(), org);
                    }
                }
            }
        }
        Err(e) => {
            println!(
                "  {}",
                style(format!("Error fetching organizations: {}", e)).red()
            );
        }
    }

    Ok(())
}
