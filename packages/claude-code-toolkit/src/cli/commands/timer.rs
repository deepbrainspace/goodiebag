use crate::{config::credentials::CredentialsManager, error::*};
use console::{Term, style};
use std::time::Duration;
use tokio::time::sleep;

pub async fn handle_timer() -> Result<()> {
    let term = Term::stdout();
    let credentials_manager = CredentialsManager::new()?;

    println!("{}", style("⏱️  Claude Code Session Timer").bold());
    println!();
    println!("{}", style("Press Ctrl+C to exit").dim());
    println!();

    loop {
        // Clear previous lines if not first iteration
        term.move_cursor_up(3)?;
        term.clear_line()?;
        term.move_cursor_up(1)?;
        term.clear_line()?;
        term.move_cursor_up(1)?;
        term.clear_line()?;

        match display_session_info(&credentials_manager).await {
            Ok(()) => {}
            Err(e) => {
                println!("{}", style(format!("Error reading session: {}", e)).red());
                println!();
                println!();
            }
        }

        // Wait for 1 second before next update
        sleep(Duration::from_secs(1)).await;
    }
}

async fn display_session_info(credentials_manager: &CredentialsManager) -> Result<()> {
    let session_info = credentials_manager.get_session_info().await?;

    if session_info.is_expired {
        println!("Session Status: {}", style("EXPIRED").red().bold());
        println!("{}", style("Please authenticate with Claude Code").red());
        println!();
    } else {
        let time_str = CredentialsManager::format_time_remaining(session_info.time_remaining);

        // Determine color based on time remaining
        let time_style = if session_info.time_remaining < 30 * 60 * 1000 {
            // Less than 30 minutes - red
            style(time_str).red().bold()
        } else if session_info.time_remaining < 2 * 60 * 60 * 1000 {
            // Less than 2 hours - yellow
            style(time_str).yellow().bold()
        } else {
            // More than 2 hours - green
            style(time_str).green().bold()
        };

        println!("Session Status: {}", style("ACTIVE").green().bold());
        println!("Time Remaining: {}", time_style);

        // Progress bar
        let session_duration = 7 * 24 * 60 * 60 * 1000; // Assume 7-day sessions
        let percentage = ((session_info.time_remaining as f64 / session_duration as f64) * 100.0)
            .clamp(0.0, 100.0);

        let bar_length = 30;
        let filled = ((percentage / 100.0) * bar_length as f64) as usize;
        let empty = bar_length - filled;

        let progress_bar = format!(
            "{}{}",
            style("█".repeat(filled)).green(),
            style("░".repeat(empty)).dim()
        );

        println!("Progress: {} {:.1}%", progress_bar, percentage);
    }

    Ok(())
}
