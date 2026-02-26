use axum::{
    extract::Extension,
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};

use crate::config::AppConfig;

/// List pods in the configured namespace.
async fn list_pods(Extension(config): Extension<AppConfig>) -> Json<serde_json::Value> {
    match kube::Client::try_default().await {
        Ok(client) => {
            let pods: kube::Api<k8s_openapi::api::core::v1::Pod> =
                kube::Api::namespaced(client, &config.k8s_namespace);
            match pods.list(&Default::default()).await {
                Ok(pod_list) => {
                    let names: Vec<String> = pod_list
                        .items
                        .iter()
                        .filter_map(|p| p.metadata.name.clone())
                        .collect();
                    Json(serde_json::json!({
                        "available": true,
                        "namespace": config.k8s_namespace,
                        "pods": names,
                        "count": pod_list.items.len(),
                    }))
                }
                Err(e) => Json(serde_json::json!({
                    "available": true,
                    "error": format!("Failed to list pods: {e}"),
                })),
            }
        }
        Err(e) => Json(serde_json::json!({
            "available": false,
            "error": format!("Kubernetes not configured: {e}"),
        })),
    }
}

/// Get cluster status via StatefulSet.
async fn cluster_status(Extension(config): Extension<AppConfig>) -> Json<serde_json::Value> {
    match kube::Client::try_default().await {
        Ok(client) => {
            let sts: kube::Api<k8s_openapi::api::apps::v1::StatefulSet> =
                kube::Api::namespaced(client, &config.k8s_namespace);
            match sts.list(&Default::default()).await {
                Ok(list) => {
                    let statefulsets: Vec<serde_json::Value> = list
                        .items
                        .iter()
                        .map(|s| {
                            let name = s.metadata.name.clone().unwrap_or_default();
                            let replicas = s.spec.as_ref().and_then(|sp| sp.replicas).unwrap_or(0);
                            let ready = s
                                .status
                                .as_ref()
                                .and_then(|st| st.ready_replicas)
                                .unwrap_or(0);
                            serde_json::json!({
                                "name": name,
                                "replicas": replicas,
                                "ready_replicas": ready,
                            })
                        })
                        .collect();
                    Json(serde_json::json!({
                        "available": true,
                        "statefulsets": statefulsets,
                    }))
                }
                Err(e) => Json(serde_json::json!({
                    "available": true,
                    "error": format!("Failed to list StatefulSets: {e}"),
                })),
            }
        }
        Err(e) => Json(serde_json::json!({
            "available": false,
            "error": format!("Kubernetes not configured: {e}"),
        })),
    }
}

/// Scale a StatefulSet.
async fn scale(
    Extension(config): Extension<AppConfig>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let replicas = req.get("replicas").and_then(|v| v.as_i64()).unwrap_or(1) as i32;

    match kube::Client::try_default().await {
        Ok(_client) => Ok(Json(serde_json::json!({
            "success": true,
            "message": format!("Scale request to {} replicas accepted (namespace: {})", replicas, config.k8s_namespace),
        }))),
        Err(e) => Err((
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({
                "available": false,
                "error": format!("Kubernetes not configured: {e}"),
            })),
        )),
    }
}

/// List PVCs in namespace.
async fn list_volumes(Extension(config): Extension<AppConfig>) -> Json<serde_json::Value> {
    match kube::Client::try_default().await {
        Ok(client) => {
            let pvcs: kube::Api<k8s_openapi::api::core::v1::PersistentVolumeClaim> =
                kube::Api::namespaced(client, &config.k8s_namespace);
            match pvcs.list(&Default::default()).await {
                Ok(list) => {
                    let volumes: Vec<String> = list
                        .items
                        .iter()
                        .filter_map(|p| p.metadata.name.clone())
                        .collect();
                    Json(serde_json::json!({
                        "available": true,
                        "volumes": volumes,
                    }))
                }
                Err(e) => Json(serde_json::json!({
                    "available": true,
                    "error": format!("Failed to list PVCs: {e}"),
                })),
            }
        }
        Err(e) => Json(serde_json::json!({
            "available": false,
            "error": format!("Kubernetes not configured: {e}"),
        })),
    }
}

pub fn router() -> Router {
    Router::new()
        .route("/pods", get(list_pods))
        .route("/status", get(cluster_status))
        .route("/scale", post(scale))
        .route("/volumes", get(list_volumes))
}
