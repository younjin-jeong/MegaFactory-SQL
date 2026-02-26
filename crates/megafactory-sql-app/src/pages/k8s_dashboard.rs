use leptos::prelude::*;
use megafactory_sql_types::k8s::*;

use crate::components::auto_refresh::{AutoRefreshControl, RefreshInterval};
use crate::components::pod_card::PodCard;
use crate::components::scaling_panel::ScalingPanel;
use crate::components::storage_panel::StoragePanel;

/// Server function to get cluster status.
/// Returns mock data in Phase 1.
#[server(GetClusterStatus, "/api")]
pub async fn get_cluster_status() -> Result<ClusterStatus, ServerFnError> {
    Ok(ClusterStatus {
        phase: "Ready".to_string(),
        ready_replicas: 3,
        total_replicas: 3,
        coordinator_endpoint: "10.0.1.5:5432".to_string(),
        message: "All pods healthy".to_string(),
        pods: vec![
            PodInfo {
                name: "megadb-coordinator-0".into(),
                role: "coordinator".into(),
                status: "Running".into(),
                cpu_usage_percent: 23.0,
                memory_bytes: 4_400_000_000,
                memory_limit_bytes: 8_000_000_000,
                disk_usage_percent: 45.0,
                restart_count: 0,
                age_seconds: 86400 * 3,
            },
            PodInfo {
                name: "megadb-worker-0".into(),
                role: "worker".into(),
                status: "Running".into(),
                cpu_usage_percent: 67.0,
                memory_bytes: 12_700_000_000,
                memory_limit_bytes: 16_000_000_000,
                disk_usage_percent: 72.0,
                restart_count: 0,
                age_seconds: 86400 * 3,
            },
            PodInfo {
                name: "megadb-worker-1".into(),
                role: "worker".into(),
                status: "Running".into(),
                cpu_usage_percent: 45.0,
                memory_bytes: 9_100_000_000,
                memory_limit_bytes: 16_000_000_000,
                disk_usage_percent: 31.0,
                restart_count: 1,
                age_seconds: 86400 * 2,
            },
        ],
        volumes: vec![
            VolumeInfo {
                name: "wal-pvc".into(),
                access_mode: "ReadWriteMany".into(),
                capacity_bytes: 50 * 1024 * 1024 * 1024,
                used_bytes: 12 * 1024 * 1024 * 1024,
                bound_pod: "shared".into(),
            },
            VolumeInfo {
                name: "cache-pvc-worker-0".into(),
                access_mode: "ReadWriteOnce".into(),
                capacity_bytes: 100 * 1024 * 1024 * 1024,
                used_bytes: 72 * 1024 * 1024 * 1024,
                bound_pod: "megadb-worker-0".into(),
            },
            VolumeInfo {
                name: "cache-pvc-worker-1".into(),
                access_mode: "ReadWriteOnce".into(),
                capacity_bytes: 100 * 1024 * 1024 * 1024,
                used_bytes: 31 * 1024 * 1024 * 1024,
                bound_pod: "megadb-worker-1".into(),
            },
        ],
    })
}

/// Server function to scale the cluster.
#[server(ScaleCluster, "/api")]
pub async fn scale_cluster(replicas: i32) -> Result<String, ServerFnError> {
    // Phase 1: mock. Phase 3: proxy to K8s API.
    Ok(format!("Scaling to {replicas} replicas (mock)"))
}

/// Kubernetes Dashboard page.
#[component]
pub fn K8sDashboardPage() -> impl IntoView {
    let (refresh_counter, set_refresh_counter) = signal(0u32);
    let cluster = Resource::new(move || refresh_counter.get(), |_| get_cluster_status());

    let on_refresh = Callback::new(move |_: ()| {
        set_refresh_counter.update(|c| *c += 1);
    });

    view! {
        <div class="k8s-dashboard-page">
            <div class="k8s-dashboard-header">
                <h2>"Kubernetes Dashboard"</h2>
                <AutoRefreshControl
                    initial_interval=RefreshInterval::Off
                    on_refresh=on_refresh
                />
            </div>

            <Suspense fallback=|| view! { <p>"Loading cluster status..."</p> }>
                {move || {
                    cluster.get().map(|result| {
                        match result {
                            Ok(status) => view! { <ClusterView status=status /> }.into_any(),
                            Err(e) => view! {
                                <div class="error-panel">
                                    <p>{format!("Failed to load cluster status: {e}")}</p>
                                </div>
                            }.into_any(),
                        }
                    })
                }}
            </Suspense>
        </div>
    }
}

#[component]
fn ClusterView(status: ClusterStatus) -> impl IntoView {
    let phase_class = match status.phase.as_str() {
        "Ready" => "cluster-phase--ready",
        _ => "cluster-phase--unknown",
    };

    let current_replicas = Signal::derive({
        let r = status.ready_replicas;
        move || r
    });
    let min_replicas = Signal::derive(|| 1i32);
    let max_replicas = Signal::derive(|| 32i32);

    let scale_action = Action::new(move |replicas: &i32| {
        let replicas = *replicas;
        async move { scale_cluster(replicas).await }
    });

    let on_scale = Callback::new(move |replicas: i32| {
        scale_action.dispatch(replicas);
    });

    let volumes = Signal::derive({
        let v = status.volumes.clone();
        move || v.clone()
    });

    view! {
        <div class="cluster-view">
            <div class="cluster-header">
                <div class="cluster-info">
                    <span class=format!("cluster-phase {phase_class}")>{status.phase.clone()}</span>
                    <span class="cluster-replicas">
                        {format!("Workers: {}/{}", status.ready_replicas, status.total_replicas)}
                    </span>
                    <span class="cluster-endpoint">
                        {format!("Coordinator: {}", status.coordinator_endpoint)}
                    </span>
                </div>
            </div>

            <ScalingPanel
                current_replicas=current_replicas
                min_replicas=min_replicas
                max_replicas=max_replicas
                on_scale=on_scale
            />

            <div class="pod-grid">
                {status.pods.iter().map(|pod| {
                    view! { <PodCard pod=pod.clone() /> }
                }).collect::<Vec<_>>()}
            </div>

            <StoragePanel volumes=volumes />
        </div>
    }
}
