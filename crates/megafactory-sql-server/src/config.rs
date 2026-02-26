/// Application configuration loaded from environment variables.
#[derive(Debug, Clone)]
pub struct AppConfig {
    /// Address to bind the web server (default: 0.0.0.0:3000)
    pub bind_address: String,
    /// MegaDB HTTP API URL (default: http://localhost:8080)
    pub megadb_url: String,
    /// MegaDB WebSocket URL (default: ws://localhost:8080/ws). Used by client-side WS.
    #[allow(dead_code)]
    pub megadb_ws_url: String,
    /// Prometheus URL for metrics (default: http://localhost:9090)
    pub prometheus_url: String,
    /// Kubernetes namespace (default: default)
    pub k8s_namespace: String,
    /// Shared HTTP client for proxy requests
    pub client: reqwest::Client,
}

impl AppConfig {
    pub fn from_env() -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .pool_max_idle_per_host(10)
            .build()
            .expect("Failed to build HTTP client");

        Self {
            bind_address: std::env::var("MEGAFACTORY_BIND")
                .unwrap_or_else(|_| "0.0.0.0:3000".to_string()),
            megadb_url: std::env::var("MEGADB_URL")
                .unwrap_or_else(|_| "http://localhost:8080".to_string()),
            megadb_ws_url: std::env::var("MEGADB_WS_URL")
                .unwrap_or_else(|_| "ws://localhost:8080/ws".to_string()),
            prometheus_url: std::env::var("PROMETHEUS_URL")
                .unwrap_or_else(|_| "http://localhost:9090".to_string()),
            k8s_namespace: std::env::var("K8S_NAMESPACE").unwrap_or_else(|_| "default".to_string()),
            client,
        }
    }
}
