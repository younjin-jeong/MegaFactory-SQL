use leptos::prelude::*;
use megafactory_sql_types::k8s::VolumeInfo;

/// Panel displaying storage volumes and their usage.
#[component]
pub fn StoragePanel(volumes: Signal<Vec<VolumeInfo>>) -> impl IntoView {
    view! {
        <div class="storage-panel">
            <h3>"Storage Volumes"</h3>
            <table class="storage-table">
                <thead>
                    <tr>
                        <th>"PVC Name"</th>
                        <th>"Access"</th>
                        <th>"Capacity"</th>
                        <th>"Used"</th>
                        <th>"Pod"</th>
                    </tr>
                </thead>
                <tbody>
                    {move || volumes.get().iter().map(|vol| {
                        let used_pct = if vol.capacity_bytes > 0 {
                            (vol.used_bytes as f64 / vol.capacity_bytes as f64) * 100.0
                        } else {
                            0.0
                        };
                        view! {
                            <tr>
                                <td>{vol.name.clone()}</td>
                                <td>{vol.access_mode.clone()}</td>
                                <td>{format_bytes(vol.capacity_bytes)}</td>
                                <td>
                                    <div class="storage-usage">
                                        <div
                                            class="storage-usage-bar"
                                            style=format!("width:{}%", used_pct)
                                        ></div>
                                        <span>{format!("{:.0}%", used_pct)}</span>
                                    </div>
                                </td>
                                <td>{vol.bound_pod.clone()}</td>
                            </tr>
                        }
                    }).collect::<Vec<_>>()}
                </tbody>
            </table>
        </div>
    }
}

fn format_bytes(bytes: u64) -> String {
    if bytes >= 1024 * 1024 * 1024 {
        format!("{:.1} Gi", bytes as f64 / (1024.0 * 1024.0 * 1024.0))
    } else if bytes >= 1024 * 1024 {
        format!("{:.0} Mi", bytes as f64 / (1024.0 * 1024.0))
    } else {
        format!("{} Ki", bytes / 1024)
    }
}
