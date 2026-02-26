use axum::{
    extract::Extension,
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};

use crate::config::AppConfig;

/// Health check: probes MegaDB at config.megadb_url/health with 3s timeout.
async fn health_check(Extension(config): Extension<AppConfig>) -> impl IntoResponse {
    let start = std::time::Instant::now();
    let reachable = config
        .client
        .get(format!("{}/health", config.megadb_url))
        .timeout(std::time::Duration::from_secs(3))
        .send()
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false);

    Json(serde_json::json!({
        "megadb_reachable": reachable,
        "latency_ms": start.elapsed().as_millis(),
        "megadb_url": config.megadb_url,
    }))
}

/// Query proxy: forwards SQL to MegaDB POST /query.
async fn proxy_query(
    Extension(config): Extension<AppConfig>,
    Json(req): Json<megafactory_sql_types::query::QueryRequest>,
) -> Result<Json<megafactory_sql_types::query::QueryResult>, (StatusCode, Json<serde_json::Value>)>
{
    let resp = config
        .client
        .post(format!("{}/query", config.megadb_url))
        .json(&req)
        .timeout(std::time::Duration::from_secs(60))
        .send()
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                Json(serde_json::json!({"error": format!("MegaDB unreachable: {e}")})),
            )
        })?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err((
            StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
            Json(serde_json::json!({"error": body})),
        ));
    }

    let result = resp.json().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": format!("Failed to parse response: {e}")})),
        )
    })?;

    Ok(Json(result))
}

/// Tables proxy: GET /proxy/megadb/tables.
async fn proxy_tables(
    Extension(config): Extension<AppConfig>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let resp = config
        .client
        .get(format!("{}/tables", config.megadb_url))
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                Json(serde_json::json!({"error": format!("MegaDB unreachable: {e}")})),
            )
        })?;

    let body: serde_json::Value = resp.json().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": format!("Parse error: {e}")})),
        )
    })?;

    Ok(Json(body))
}

/// Metrics proxy: GET /proxy/megadb/metrics.
async fn proxy_metrics(
    Extension(config): Extension<AppConfig>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let resp = config
        .client
        .get(format!("{}/metrics", config.megadb_url))
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                Json(serde_json::json!({"error": format!("MegaDB unreachable: {e}")})),
            )
        })?;

    let text = resp.text().await.unwrap_or_default();
    Ok(text)
}

pub fn router() -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/query", post(proxy_query))
        .route("/tables", get(proxy_tables))
        .route("/metrics", get(proxy_metrics))
}
