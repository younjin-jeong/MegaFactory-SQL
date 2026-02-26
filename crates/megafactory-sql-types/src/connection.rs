use serde::{Deserialize, Serialize};

/// Configuration for connecting to a MegaDB instance.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionConfig {
    pub id: uuid::Uuid,
    pub name: String,
    pub host: String,
    pub http_port: u16,
    pub pg_port: u16,
    pub database: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub k8s_namespace: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Current connection status.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub enum ConnectionStatus {
    #[default]
    Disconnected,
    Connecting,
    Connected,
    Error(String),
}

impl Default for ConnectionConfig {
    fn default() -> Self {
        Self {
            id: uuid::Uuid::new_v4(),
            name: "Local MegaDB".to_string(),
            host: "localhost".to_string(),
            http_port: 8080,
            pg_port: 5432,
            database: "megadb".to_string(),
            username: None,
            k8s_namespace: Some("default".to_string()),
            created_at: chrono::Utc::now(),
        }
    }
}
