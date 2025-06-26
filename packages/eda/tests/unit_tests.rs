use eda::{EdaConfig, EdaError, Conversation, ConversationRole};
use chrono::Utc;

/// Unit tests for EDA core functionality
/// Run with: cargo test --test unit_tests

#[test]
fn test_conversation_creation() {
    let conversation = Conversation::new(
        ConversationRole::User,
        "Hello, how do I optimize React performance?".to_string(),
        "my-project".to_string(),
        "session-123".to_string(),
    );
    
    assert_eq!(conversation.role, ConversationRole::User);
    assert_eq!(conversation.content, "Hello, how do I optimize React performance?");
    assert_eq!(conversation.user_message, "Hello, how do I optimize React performance?");
    assert_eq!(conversation.assistant_message, "");
    assert_eq!(conversation.project_path, "my-project");
    assert_eq!(conversation.session_id, "session-123");
    assert!(conversation.uuid.is_none());
    assert!(conversation.embedding.is_none());
}

#[test]
fn test_assistant_conversation_creation() {
    let conversation = Conversation::new(
        ConversationRole::Assistant,
        "You can optimize React performance using React.memo...".to_string(),
        "my-project".to_string(),
        "session-123".to_string(),
    );
    
    assert_eq!(conversation.role, ConversationRole::Assistant);
    assert_eq!(conversation.user_message, "");
    assert_eq!(conversation.assistant_message, "You can optimize React performance using React.memo...");
}

#[test]
fn test_config_default_values() {
    let config = EdaConfig::default();
    
    assert_eq!(config.database.url, "ws://localhost:8000");
    assert_eq!(config.database.username, "root");
    assert_eq!(config.database.password, "root");
    assert_eq!(config.database.namespace, "eda");
    assert_eq!(config.database.database, "memory");
    
    // Should default to ~/.claude/projects
    assert!(config.claude_projects_path.to_string_lossy().contains(".claude/projects"));
}

#[test]
fn test_conversation_role_serialization() {
    // Test that roles serialize to lowercase strings
    let user_role = ConversationRole::User;
    let assistant_role = ConversationRole::Assistant;
    
    let user_json = serde_json::to_string(&user_role).unwrap();
    let assistant_json = serde_json::to_string(&assistant_role).unwrap();
    
    assert_eq!(user_json, "\"user\"");
    assert_eq!(assistant_json, "\"assistant\"");
}

#[test]
fn test_conversation_role_deserialization() {
    // Test that we can deserialize from JSON
    let user_role: ConversationRole = serde_json::from_str("\"user\"").unwrap();
    let assistant_role: ConversationRole = serde_json::from_str("\"assistant\"").unwrap();
    
    matches!(user_role, ConversationRole::User);
    matches!(assistant_role, ConversationRole::Assistant);
}