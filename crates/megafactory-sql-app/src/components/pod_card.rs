use leptos::prelude::*;
use megafactory_sql_types::k8s::PodInfo;

/// Card displaying a single pod's status and resource usage.
#[component]
pub fn PodCard(pod: PodInfo) -> impl IntoView {
    let status_class = match pod.status.as_str() {
        "Running" => "pod-status--running",
        "Pending" => "pod-status--pending",
        "Failed" => "pod-status--failed",
        _ => "pod-status--unknown",
    };

    view! {
        <div class="pod-card">
            <div class="pod-card-header">
                <span class="pod-name">{pod.name.clone()}</span>
                <span class=format!("pod-status {status_class}")>{pod.status.clone()}</span>
            </div>
            <div class="pod-card-role">{pod.role.clone()}</div>
            <div class="pod-card-metrics">
                <MetricBar label="CPU" value=pod.cpu_usage_percent suffix="%" />
                <MetricBar label="Mem" value={(pod.memory_bytes as f64 / pod.memory_limit_bytes as f64) * 100.0} suffix="%" />
                <MetricBar label="Disk" value=pod.disk_usage_percent suffix="%" />
            </div>
            <div class="pod-card-footer">
                <span class="pod-restarts">{format!("Restarts: {}", pod.restart_count)}</span>
                <span class="pod-age">{pod.age_display()}</span>
            </div>
        </div>
    }
}

#[component]
fn MetricBar(label: &'static str, value: f64, suffix: &'static str) -> impl IntoView {
    let bar_class = if value > 90.0 {
        "metric-bar-fill metric-bar-fill--critical"
    } else if value > 70.0 {
        "metric-bar-fill metric-bar-fill--warning"
    } else {
        "metric-bar-fill metric-bar-fill--normal"
    };
    let width = format!("{}%", value.min(100.0));

    view! {
        <div class="metric-row">
            <span class="metric-label">{label}</span>
            <div class="metric-bar">
                <div class=bar_class style=format!("width:{width}")></div>
            </div>
            <span class="metric-value">{format!("{:.0}{suffix}", value)}</span>
        </div>
    }
}
