use serde::{Deserialize, Serialize};

/// Top-level database info.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseInfo {
    pub name: String,
    pub default_engine: String,
    pub schemas: Vec<SchemaInfo>,
}

/// Schema within a database.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaInfo {
    pub name: String,
    pub tables: Vec<TableInfo>,
}

/// Table metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableInfo {
    pub schema_name: String,
    pub name: String,
    /// Storage engine: "OLAP", "OLTP", "MEMORY"
    pub engine: String,
    pub row_count: Option<u64>,
    pub size_bytes: Option<u64>,
    pub columns: Vec<ColumnInfo>,
    pub partitions: Vec<PartitionInfo>,
    /// OLAP-specific: compression codec
    #[serde(skip_serializing_if = "Option::is_none")]
    pub compression: Option<String>,
    /// OLAP-specific: sort columns
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sort_columns: Option<Vec<String>>,
}

/// Column metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comment: Option<String>,
}

/// Partition specification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PartitionInfo {
    pub column: String,
    /// Transform: "identity", "bucket(N)", "year", "month", "day", "hour", "truncate(N)"
    pub transform: String,
}
