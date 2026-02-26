use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Extension,
    },
    response::IntoResponse,
};
use std::sync::Arc;
use tokio::sync::broadcast;

/// WebSocket hub managing topic-based broadcast channels.
pub struct WsHub {
    metrics_tx: broadcast::Sender<String>,
    k8s_tx: broadcast::Sender<String>,
    #[allow(dead_code)]
    query_tx: broadcast::Sender<String>,
}

impl WsHub {
    pub fn new() -> Arc<Self> {
        let (metrics_tx, _) = broadcast::channel(64);
        let (k8s_tx, _) = broadcast::channel(64);
        let (query_tx, _) = broadcast::channel(64);

        let hub = Arc::new(Self {
            metrics_tx,
            k8s_tx,
            query_tx,
        });

        Self::spawn_mock_metrics(hub.clone());
        Self::spawn_mock_k8s_events(hub.clone());

        hub
    }

    /// Send mock metrics updates every 5 seconds.
    fn spawn_mock_metrics(hub: Arc<Self>) {
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(std::time::Duration::from_secs(5));
            loop {
                interval.tick().await;
                let metrics = megafactory_sql_types::metrics::QueryMetrics {
                    queries_per_second: 200.0 + rand_f64() * 100.0,
                    avg_latency_ms: 15.0 + rand_f64() * 20.0,
                    p50_latency_ms: 8.0 + rand_f64() * 10.0,
                    p95_latency_ms: 60.0 + rand_f64() * 60.0,
                    p99_latency_ms: 120.0 + rand_f64() * 80.0,
                    active_sessions: (8.0 + rand_f64() * 10.0) as u32,
                    open_connections: (5.0 + rand_f64() * 8.0) as u32,
                };
                let msg = megafactory_sql_types::ws::WsServerMessage::MetricsUpdate(metrics);
                if let Ok(json) = serde_json::to_string(&msg) {
                    let _ = hub.metrics_tx.send(json);
                }
            }
        });
    }

    /// Send mock K8s events every 10 seconds.
    fn spawn_mock_k8s_events(hub: Arc<Self>) {
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(std::time::Duration::from_secs(10));
            let events = [
                ("MODIFIED", "megadb-worker-0", "CPU usage 67% -> 72%"),
                (
                    "MODIFIED",
                    "megadb-worker-1",
                    "Memory usage stable at 9.1GB",
                ),
                ("MODIFIED", "megadb-coordinator-0", "Health check passed"),
            ];
            let mut idx = 0;
            loop {
                interval.tick().await;
                let (event_type, pod_name, message) = events[idx % events.len()];
                let event = megafactory_sql_types::ws::K8sEvent {
                    event_type: event_type.into(),
                    pod_name: pod_name.into(),
                    message: message.into(),
                };
                let msg = megafactory_sql_types::ws::WsServerMessage::K8sEvent(event);
                if let Ok(json) = serde_json::to_string(&msg) {
                    let _ = hub.k8s_tx.send(json);
                }
                idx += 1;
            }
        });
    }
}

/// Axum handler for WebSocket upgrade.
pub async fn ws_upgrade_handler(
    ws: WebSocketUpgrade,
    Extension(hub): Extension<Arc<WsHub>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, hub))
}

async fn handle_socket(mut socket: WebSocket, hub: Arc<WsHub>) {
    let mut metrics_rx = hub.metrics_tx.subscribe();
    let mut k8s_rx = hub.k8s_tx.subscribe();

    loop {
        tokio::select! {
            Ok(msg) = metrics_rx.recv() => {
                if socket.send(Message::Text(msg.into())).await.is_err() {
                    break;
                }
            }
            Ok(msg) = k8s_rx.recv() => {
                if socket.send(Message::Text(msg.into())).await.is_err() {
                    break;
                }
            }
            Some(msg) = socket.recv() => {
                match msg {
                    Ok(Message::Text(text)) => {
                        if let Ok(megafactory_sql_types::ws::WsClientMessage::Ping) = serde_json::from_str::<megafactory_sql_types::ws::WsClientMessage>(&text) {
                            let pong = serde_json::to_string(&megafactory_sql_types::ws::WsServerMessage::Pong).unwrap_or_default();
                            if socket.send(Message::Text(pong.into())).await.is_err() {
                                break;
                            }
                        }
                    }
                    Ok(Message::Close(_)) | Err(_) => break,
                    _ => {}
                }
            }
            else => break,
        }
    }
}

/// Simple pseudo-random f64 in [0, 1) using system time.
fn rand_f64() -> f64 {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .subsec_nanos();
    (nanos % 1000) as f64 / 1000.0
}
