use leptos::prelude::*;
use megafactory_sql_types::k8s::ClusterStatus;

/// Global Kubernetes cluster state.
#[derive(Debug, Clone)]
pub struct K8sState {
    pub cluster: ClusterStatus,
    pub is_connected: bool,
    pub auto_refresh: bool,
    pub refresh_interval_secs: u32,
}

impl Default for K8sState {
    fn default() -> Self {
        Self {
            cluster: ClusterStatus::default(),
            is_connected: false,
            auto_refresh: true,
            refresh_interval_secs: 5,
        }
    }
}

pub fn provide_k8s_state() {
    let state = signal(K8sState::default());
    provide_context(state);
}

pub fn use_k8s_state() -> (ReadSignal<K8sState>, WriteSignal<K8sState>) {
    expect_context::<(ReadSignal<K8sState>, WriteSignal<K8sState>)>()
}
