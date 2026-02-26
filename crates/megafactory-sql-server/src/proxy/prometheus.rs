use axum::{
    extract::{Extension, Query},
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};

use crate::config::AppConfig;

/// Proxy PromQL instant query.
async fn query_instant(
    Extension(config): Extension<AppConfig>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let query = params.get("query").cloned().unwrap_or_default();

    let resp = config
        .client
        .get(format!("{}/api/v1/query", config.prometheus_url))
        .query(&[("query", &query)])
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                Json(serde_json::json!({"error": format!("Prometheus unreachable: {e}")})),
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

/// Proxy PromQL range query.
async fn query_range(
    Extension(config): Extension<AppConfig>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let query = params.get("query").cloned().unwrap_or_default();
    let start = params.get("start").cloned().unwrap_or_default();
    let end = params.get("end").cloned().unwrap_or_default();
    let step = params.get("step").cloned().unwrap_or_else(|| "15s".into());

    let resp = config
        .client
        .get(format!("{}/api/v1/query_range", config.prometheus_url))
        .query(&[
            ("query", &query),
            ("start", &start),
            ("end", &end),
            ("step", &step),
        ])
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                Json(serde_json::json!({"error": format!("Prometheus unreachable: {e}")})),
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

pub fn router() -> Router {
    Router::new()
        .route("/query", get(query_instant))
        .route("/query_range", get(query_range))
}
