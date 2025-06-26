use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: Option<String>,
    pub role: ConversationRole,
    pub content: String,
    pub user_message: String,
    pub assistant_message: String,
    pub timestamp: DateTime<Utc>,
    pub project_path: String,
    pub session_id: String,
    pub uuid: Option<String>,
    pub parent_uuid: Option<String>,
    pub embedding: Option<Vec<f32>>,
    pub context: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ConversationRole {
    User,
    Assistant,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedFile {
    pub file_path: String,
    pub file_size: u64,
    pub file_mtime: f64,
    pub file_hash: String,
    pub processed_at: DateTime<Utc>,
    pub conversation_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relationship {
    pub subject: String,
    pub predicate: String,
    pub object: String,
    pub confidence: f32,
    pub context: String,
    pub discovered_at: DateTime<Utc>,
    pub source_conversation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Insight {
    pub insight_type: String,
    pub description: String,
    pub confidence: f32,
    pub supporting_conversations: Vec<String>,
    pub discovered_at: DateTime<Utc>,
}

impl Conversation {
    pub fn new(
        role: ConversationRole,
        content: String,
        project_path: String,
        session_id: String,
    ) -> Self {
        let (user_message, assistant_message) = match role {
            ConversationRole::User => (content.clone(), String::new()),
            ConversationRole::Assistant => (String::new(), content.clone()),
        };

        Self {
            id: None,
            role,
            content,
            user_message,
            assistant_message,
            timestamp: Utc::now(),
            project_path,
            session_id,
            uuid: None,
            parent_uuid: None,
            embedding: None,
            context: serde_json::Value::Object(serde_json::Map::new()),
        }
    }
}