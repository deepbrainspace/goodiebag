use crate::{config::manager::ConfigurationManager, error::*};
use console::{Emoji, style};

static SUCCESS: Emoji<'_, '_> = Emoji("✅ ", "");
static INFO: Emoji<'_, '_> = Emoji("ℹ️ ", "");

pub async fn handle_add_repo(repo: String, secret_name: String) -> Result<()> {
    println!(
        "{}Adding repository {} with secret {}",
        INFO,
        style(&repo).bold(),
        style(&secret_name).bold()
    );

    let config_manager = ConfigurationManager::new()?;
    config_manager
        .add_repository(repo.clone(), secret_name.clone())
        .await?;

    println!(
        "{}Successfully added repository {}",
        SUCCESS,
        style(&repo).bold()
    );
    println!(
        "{}",
        style(format!("Secret will be synced as: {}", secret_name)).dim()
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
        println!("    Secret: {}", style(&repo.secret_name).dim());
    }

    println!();
    println!(
        "{}",
        style("Tip: Use 'gh repo list' to see all your available repositories").dim()
    );

    Ok(())
}
