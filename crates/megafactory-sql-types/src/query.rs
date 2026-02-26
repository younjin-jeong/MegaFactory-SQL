use serde::{Deserialize, Serialize};

/// Request to execute a SQL query against MegaDB.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryRequest {
    pub sql: String,
    pub database: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<u64>,
}

/// Result of a SQL query execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryResult {
    pub columns: Vec<QueryColumn>,
    pub rows: Vec<Vec<serde_json::Value>>,
    pub row_count: u64,
    pub execution_time_ms: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Column metadata in a query result.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryColumn {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
}

/// A saved query with name and metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedQuery {
    pub id: uuid::Uuid,
    pub name: String,
    pub sql: String,
    pub database: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Entry in the query history.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryHistoryEntry {
    pub id: uuid::Uuid,
    pub sql: String,
    pub database: String,
    pub execution_time_ms: u64,
    pub row_count: u64,
    pub executed_at: chrono::DateTime<chrono::Utc>,
    pub success: bool,
}

impl QueryResult {
    /// Create a successful empty result.
    pub fn empty() -> Self {
        Self {
            columns: vec![],
            rows: vec![],
            row_count: 0,
            execution_time_ms: 0,
            error: None,
        }
    }

    /// Check if the query was successful (no error).
    pub fn is_ok(&self) -> bool {
        self.error.is_none()
    }
}
