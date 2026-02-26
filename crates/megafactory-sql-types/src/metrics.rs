use serde::{Deserialize, Serialize};

/// A single metric data point.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricPoint {
    pub timestamp: f64,
    pub value: f64,
}

/// Resource usage snapshot for a pod.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceUsage {
    pub pod_name: String,
    pub cpu_percent: f64,
    pub memory_bytes: u64,
    pub disk_read_bytes_sec: u64,
    pub disk_write_bytes_sec: u64,
    pub network_rx_bytes_sec: u64,
    pub network_tx_bytes_sec: u64,
}

/// Aggregated query performance metrics.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryMetrics {
    pub queries_per_second: f64,
    pub avg_latency_ms: f64,
    pub p50_latency_ms: f64,
    pub p95_latency_ms: f64,
    pub p99_latency_ms: f64,
    pub active_sessions: u32,
    pub open_connections: u32,
}

/// An active query visible in the monitoring dashboard.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveQuery {
    pub session_id: String,
    pub duration_ms: u64,
    /// "parsing", "planning", "executing", "streaming"
    pub state: String,
    pub sql_preview: String,
    pub database: String,
}

/// Time-series data for a metric.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeSeries {
    pub label: String,
    pub points: Vec<MetricPoint>,
}
