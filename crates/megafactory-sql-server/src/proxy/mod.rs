pub mod k8s;
pub mod megadb;
pub mod prometheus;

use axum::Router;

/// Combined proxy router for all backend services.
pub fn router() -> Router {
    Router::new()
        .nest("/proxy/megadb", megadb::router())
        .nest("/proxy/k8s", k8s::router())
        .nest("/proxy/prom", prometheus::router())
}
