use anyhow::Result;
use eda::{EdaConfig, EdaError};

/// Integration tests for EDA functionality
/// Run with: cargo test --test integration_tests

#[tokio::test]
async fn test_config_loading() -> Result<()> {
    // Test configuration loading from environment
    let config = EdaConfig::load()?;
    
    // Basic validation that config loads without errors
    assert!(!config.database.url.is_empty());
    assert!(!config.database.username.is_empty());
    assert!(!config.claude_projects_path.as_os_str().is_empty());
    
    println!("✅ Config loaded successfully");
    println!("  Database URL: {}", config.database.url);
    println!("  Projects path: {}", config.claude_projects_path.display());
    
    Ok(())
}

#[cfg(feature = "cloudflare-tests")]
mod cloudflare_tests {
    use super::*;
    use reqwest::Client;
    use serde_json::json;
    use std::env;

    #[tokio::test]
    async fn test_cloudflare_embedding_api() -> Result<()> {
        // Load config to get API credentials
        let config = EdaConfig::load()?;
        
        let account_id = config.api_keys.cloudflare_account_id
            .ok_or_else(|| EdaError::Config("CLOUDFLARE_ACCOUNT_ID not found".to_string()))?;
        let api_token = config.api_keys.cloudflare_api_token
            .ok_or_else(|| EdaError::Config("CLOUDFLARE_API_TOKEN not found".to_string()))?;
        
        println!("🔍 Testing Cloudflare Workers AI embedding generation...");
        
        let client = Client::new();
        let inference_url = format!(
            "https://api.cloudflare.com/client/v4/accounts/{}/ai/run/@cf/baai/bge-base-en-v1.5", 
            account_id
        );
        
        let test_payload = json!({
            "text": ["Hello world", "Test embedding for EDA"]
        });
        
        let response = client
            .post(&inference_url)
            .header("Authorization", format!("Bearer {}", api_token))
            .header("Content-Type", "application/json")
            .json(&test_payload)
            .send()
            .await?;
        
        assert!(response.status().is_success(), "Cloudflare API request failed: {}", response.status());
        
        let result: serde_json::Value = response.json().await?;
        
        // Validate response structure
        let data = result.get("result")
            .and_then(|r| r.get("data"))
            .and_then(|d| d.as_array())
            .ok_or_else(|| EdaError::Api("Invalid response format".to_string()))?;
        
        assert_eq!(data.len(), 2, "Should generate 2 embeddings");
        
        if let Some(first_embedding) = data.get(0).and_then(|e| e.as_array()) {
            assert_eq!(first_embedding.len(), 768, "Embedding should be 768-dimensional");
        }
        
        println!("✅ Cloudflare embedding generation successful");
        println!("  Generated {} embeddings", data.len());
        println!("  Embedding dimension: {}", data.get(0).and_then(|e| e.as_array()).map(|e| e.len()).unwrap_or(0));
        
        Ok(())
    }
}

// More integration test modules will be added as we build components:
// mod database_tests { ... }
// mod file_monitoring_tests { ... }
// mod conversation_parsing_tests { ... }