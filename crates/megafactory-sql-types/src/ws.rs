use serde::{Deserialize, Serialize};

/// Messages sent from the client to the WebSocket server.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum WsClientMessage {
    Subscribe { topics: Vec<String> },
    Unsubscribe { topics: Vec<String> },
    Ping,
}

/// Messages sent from the server to WebSocket clients.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum WsServerMessage {
    MetricsUpdate(crate::metrics::QueryMetrics),
    K8sEvent(K8sEvent),
    QueryProgress(QueryProgressEvent),
    Pong,
    Error { message: String },
}

/// A Kubernetes cluster event.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct K8sEvent {
    pub event_type: String,
    pub pod_name: String,
    pub message: String,
}

/// Progress update for a running query.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryProgressEvent {
    pub query_id: String,
    pub progress_pct: f64,
    pub rows_processed: u64,
    pub stage: String,
}
