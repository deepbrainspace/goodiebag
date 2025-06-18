use crate::{config::manager::ConfigurationManager, error::*};
use console::{Emoji, style};

static SUCCESS: Emoji<'_, '_> = Emoji("✅ ", "");
static INFO: Emoji<'_, '_> = Emoji("ℹ️ ", "");

pub async fn handle_add_repo(repo: String) -> Result<()> {
    println!(
        "{}Adding repository {} for Claude secret sync",
        INFO,
        style(&repo).bold()
    );

    let config_manager = ConfigurationManager::new()?;
    config_manager
        .add_repository(repo.clone())
        .await?;

    println!(
        "{}Successfully added repository {}",
        SUCCESS,
        style(&repo).bold()
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

pub async fn handle_remove_repo(repo: String) -> Result<()> {
    println!("{}Removing repository {}", INFO, style(&repo).bold());

    let config_manager = ConfigurationManager::new()?;
    config_manager.remove_repository(&repo).await?;

    println!(
        "{}Successfully removed repository {}",
        SUCCESS,
        style(&repo).bold()
    );

    Ok(())
}

pub async fn handle_list_repos() -> Result<()> {
    let config_manager = ConfigurationManager::new()?;
    let config = config_manager.load_config().await?;

    if config.github.repositories.is_empty() {
        println!("{}", style("No repositories configured").yellow());
        println!(
            "{}",
            style("Use 'claude-code repo add <owner/repo>' to add a repository").dim()
        );
        return Ok(());
    }

    println!("{}", style("Configured Repositories:").bold());
    println!();

    for repo in &config.github.repositories {
        println!("  {}", style(&repo.repo).cyan());
        let secret_names: Vec<String> = config.credentials.field_mappings.values().cloned().collect();
        println!("    Secrets: {}", style(secret_names.join(", ")).dim());
    }

    println!();
    println!(
        "{}",
        style("Tip: Use 'gh repo list' to see all your available repositories").dim()
    );

    Ok(())
}
