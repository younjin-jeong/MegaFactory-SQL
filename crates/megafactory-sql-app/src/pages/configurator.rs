use leptos::prelude::*;
use megafactory_sql_types::configurator::{
    AcceleratorType, CloudProvider, ClusterHardwareStatus, DeploymentConfig, DetectedAccelerator,
    InstanceFamily, NodeHardware, PoolAccelerator, StorageBackend, TolerationConfig,
    WorkerPoolConfig,
};

/// Server function: get the instance catalog for a cloud provider.
#[server(GetInstanceCatalog, "/api")]
pub async fn get_instance_catalog(
    provider: CloudProvider,
) -> Result<Vec<InstanceFamily>, ServerFnError> {
    Ok(megafactory_sql_types::configurator::instance_catalog(
        provider,
    ))
}

/// Server function: detect hardware in the current K8s cluster.
/// Phase 1: returns mock data. Phase 3+: proxy to K8s API.
#[server(DetectClusterHardware, "/api")]
pub async fn detect_cluster_hardware() -> Result<ClusterHardwareStatus, ServerFnError> {
    Ok(mock_cluster_hardware())
}

/// Server function: generate CRD YAML from a deployment config.
#[server(GenerateCrdYaml, "/api")]
pub async fn generate_crd_yaml(config: DeploymentConfig) -> Result<String, ServerFnError> {
    Ok(config.to_crd_yaml())
}

/// Mock K8s cluster hardware status for Phase 1.
#[cfg(feature = "ssr")]
fn mock_cluster_hardware() -> ClusterHardwareStatus {
    ClusterHardwareStatus {
        detected_provider: Some(CloudProvider::Aws),
        nodes: vec![
            NodeHardware {
                node_name: "ip-10-0-1-100.ec2.internal".to_string(),
                provider_instance_type: Some("m6i.4xlarge".to_string()),
                cpu_allocatable: "16".to_string(),
                memory_allocatable_bytes: 64 * 1024 * 1024 * 1024,
                accelerators: vec![],
                labels: vec![
                    (
                        "node.kubernetes.io/instance-type".to_string(),
                        "m6i.4xlarge".to_string(),
                    ),
                    ("megadb.io/node-pool".to_string(), "cpu-pool".to_string()),
                ],
            },
            NodeHardware {
                node_name: "ip-10-0-2-200.ec2.internal".to_string(),
                provider_instance_type: Some("g6.12xlarge".to_string()),
                cpu_allocatable: "48".to_string(),
                memory_allocatable_bytes: 192 * 1024 * 1024 * 1024,
                accelerators: vec![DetectedAccelerator {
                    resource_name: "nvidia.com/gpu".to_string(),
                    accelerator_type: AcceleratorType::Gpu,
                    allocatable: 4,
                    allocated: 2,
                    device_name: Some("NVIDIA L4 24GB".to_string()),
                }],
                labels: vec![
                    (
                        "node.kubernetes.io/instance-type".to_string(),
                        "g6.12xlarge".to_string(),
                    ),
                    ("megadb.io/node-pool".to_string(), "gpu-pool".to_string()),
                ],
            },
            NodeHardware {
                node_name: "ip-10-0-3-150.ec2.internal".to_string(),
                provider_instance_type: Some("g6.12xlarge".to_string()),
                cpu_allocatable: "48".to_string(),
                memory_allocatable_bytes: 192 * 1024 * 1024 * 1024,
                accelerators: vec![DetectedAccelerator {
                    resource_name: "nvidia.com/gpu".to_string(),
                    accelerator_type: AcceleratorType::Gpu,
                    allocatable: 4,
                    allocated: 0,
                    device_name: Some("NVIDIA L4 24GB".to_string()),
                }],
                labels: vec![
                    (
                        "node.kubernetes.io/instance-type".to_string(),
                        "g6.12xlarge".to_string(),
                    ),
                    ("megadb.io/node-pool".to_string(), "gpu-pool".to_string()),
                ],
            },
        ],
        total_gpus: 8,
        total_fpgas: 0,
        total_npus: 0,
        total_tpus: 0,
        gpu_available: 6,
        fpga_available: 0,
        npu_available: 0,
        tpu_available: 0,
        k8s_connected: true,
        error: None,
    }
}

/// MegaDB Configurator page.
#[component]
pub fn ConfiguratorPage() -> impl IntoView {
    let (selected_provider, set_selected_provider) = signal(CloudProvider::Aws);
    let (selected_filter, set_selected_filter) = signal(Option::<AcceleratorType>::None);
    let (show_yaml, set_show_yaml) = signal(false);
    let (generated_yaml, set_generated_yaml) = signal(String::new());

    // Load instance catalog reactively when provider changes
    let catalog = Resource::new(move || selected_provider.get(), get_instance_catalog);

    // Load cluster hardware status once
    let (hw_counter, set_hw_counter) = signal(0u32);
    let cluster_hw = Resource::new(move || hw_counter.get(), |_| detect_cluster_hardware());

    let on_refresh_hw = move |_| {
        set_hw_counter.update(|c| *c += 1);
    };

    // Generate CRD YAML action
    let generate_action = Action::new(move |config: &DeploymentConfig| {
        let config = config.clone();
        async move { generate_crd_yaml(config).await }
    });

    // When generate_action returns, update generated_yaml and show panel
    Effect::new(move || {
        if let Some(result) = generate_action.value().get() {
            match result {
                Ok(yaml) => {
                    set_generated_yaml.set(yaml);
                    set_show_yaml.set(true);
                }
                Err(e) => {
                    set_generated_yaml.set(format!("# Error generating YAML: {e}"));
                    set_show_yaml.set(true);
                }
            }
        }
    });

    let on_generate = move |_| {
        let provider = selected_provider.get();
        let config = DeploymentConfig {
            cluster_name: "megadb-cluster".to_string(),
            provider,
            cpu_worker_pool: WorkerPoolConfig {
                instance_type: "m6i.4xlarge".to_string(),
                replicas: 3,
                min_replicas: 2,
                max_replicas: 10,
                accelerator: None,
                node_selector: vec![],
                tolerations: vec![],
            },
            gpu_worker_pool: Some(WorkerPoolConfig {
                instance_type: "g6.12xlarge".to_string(),
                replicas: 2,
                min_replicas: 1,
                max_replicas: 8,
                accelerator: Some(PoolAccelerator {
                    accelerator_type: AcceleratorType::Gpu,
                    k8s_resource_name: "nvidia.com/gpu".to_string(),
                    count_per_pod: 4,
                    device_name: "NVIDIA L4 24GB".to_string(),
                    mig_profile: None,
                }),
                node_selector: vec![("megadb.io/node-pool".to_string(), "gpu-pool".to_string())],
                tolerations: vec![TolerationConfig {
                    key: "nvidia.com/gpu".to_string(),
                    operator: "Exists".to_string(),
                    value: None,
                    effect: "NoSchedule".to_string(),
                }],
            }),
            fpga_worker_pool: None,
            npu_worker_pool: None,
            storage_backend: StorageBackend::default_for(provider),
            keda_enabled: true,
            estimated_monthly_cost_usd: 12500.0,
        };
        generate_action.dispatch(config);
    };

    view! {
        <div class="configurator-page">
            <div class="configurator-header">
                <h2>"MegaDB Configurator"</h2>
                <p class="configurator-subtitle">
                    "Configure K8s cluster deployment with hardware accelerators"
                </p>
            </div>

            <div class="configurator-layout">
                // Left: Provider + Instance Catalog
                <div class="configurator-catalog">
                    <ProviderTabs
                        selected=selected_provider
                        on_select=set_selected_provider
                    />
                    <AcceleratorFilter
                        selected=selected_filter
                        on_select=set_selected_filter
                    />
                    <Suspense fallback=|| view! { <p class="loading">"Loading instance catalog..."</p> }>
                        {move || {
                            catalog.get().map(|result| {
                                match result {
                                    Ok(families) => {
                                        let filter = selected_filter.get();
                                        let filtered: Vec<InstanceFamily> = families
                                            .into_iter()
                                            .filter(|f| match filter {
                                                Some(t) => f.accelerator_type == t,
                                                None => true,
                                            })
                                            .collect();
                                        view! { <InstanceCatalogPanel families=filtered /> }.into_any()
                                    }
                                    Err(e) => view! {
                                        <div class="error-panel">
                                            <p>{format!("Failed to load catalog: {e}")}</p>
                                        </div>
                                    }.into_any(),
                                }
                            })
                        }}
                    </Suspense>

                    <div class="configurator-actions">
                        <button class="btn btn-primary" on:click=on_generate>
                            "Generate CRD YAML"
                        </button>
                    </div>

                    {move || {
                        if show_yaml.get() {
                            let yaml = generated_yaml.get();
                            Some(view! { <CrdYamlPanel yaml=yaml /> })
                        } else {
                            None
                        }
                    }}
                </div>

                // Right: Cluster Hardware Status
                <div class="configurator-status">
                    <div class="status-header">
                        <h3>"Cluster Hardware Status"</h3>
                        <button class="btn btn-sm" on:click=on_refresh_hw>"Refresh"</button>
                    </div>
                    <Suspense fallback=|| view! { <p class="loading">"Detecting hardware..."</p> }>
                        {move || {
                            cluster_hw.get().map(|result| {
                                match result {
                                    Ok(status) => view! { <ClusterHardwarePanel status=status /> }.into_any(),
                                    Err(e) => view! {
                                        <div class="error-panel">
                                            <p>{format!("Failed to detect hardware: {e}")}</p>
                                        </div>
                                    }.into_any(),
                                }
                            })
                        }}
                    </Suspense>
                </div>
            </div>
        </div>
    }
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

/// Cloud provider selection tabs.
#[component]
fn ProviderTabs(
    selected: ReadSignal<CloudProvider>,
    on_select: WriteSignal<CloudProvider>,
) -> impl IntoView {
    let providers = CloudProvider::all();
    view! {
        <div class="provider-tabs">
            {providers.iter().map(|p| {
                let provider = *p;
                let label = provider.label();
                let is_active = move || selected.get() == provider;
                let class = move || if is_active() { "provider-tab provider-tab--active" } else { "provider-tab" };
                view! {
                    <button
                        class=class
                        on:click=move |_| on_select.set(provider)
                    >
                        {label}
                    </button>
                }
            }).collect::<Vec<_>>()}
        </div>
    }
}

/// Accelerator type filter buttons.
#[component]
fn AcceleratorFilter(
    selected: ReadSignal<Option<AcceleratorType>>,
    on_select: WriteSignal<Option<AcceleratorType>>,
) -> impl IntoView {
    let filters: Vec<(Option<AcceleratorType>, &str)> = vec![
        (None, "All"),
        (Some(AcceleratorType::Gpu), "GPU"),
        (Some(AcceleratorType::Fpga), "FPGA"),
        (Some(AcceleratorType::Npu), "NPU"),
        (Some(AcceleratorType::Tpu), "TPU"),
    ];
    view! {
        <div class="accelerator-filter">
            {filters.into_iter().map(|(filter_val, label)| {
                let is_active = move || selected.get() == filter_val;
                let class = move || if is_active() { "filter-btn filter-btn--active" } else { "filter-btn" };
                view! {
                    <button
                        class=class
                        on:click=move |_| on_select.set(filter_val)
                    >
                        {label}
                    </button>
                }
            }).collect::<Vec<_>>()}
        </div>
    }
}

/// Instance catalog display grouped by family.
#[component]
fn InstanceCatalogPanel(families: Vec<InstanceFamily>) -> impl IntoView {
    view! {
        <div class="instance-catalog">
            {families.into_iter().map(|family| {
                let family_name = family.family.clone();
                let desc = family.description.clone();
                let badge = family.accelerator_type.badge();
                view! {
                    <div class="instance-family">
                        <div class="family-header">
                            <span class="family-name">{family_name}</span>
                            <span class="family-badge">{badge}</span>
                            <span class="family-desc">{desc}</span>
                        </div>
                        <table class="instance-table">
                            <thead>
                                <tr>
                                    <th>"Instance Type"</th>
                                    <th>"vCPUs"</th>
                                    <th>"RAM"</th>
                                    <th>"Accelerator"</th>
                                    <th>"Count"</th>
                                    <th>"VRAM"</th>
                                    <th>"Network"</th>
                                    <th>"$/hr"</th>
                                </tr>
                            </thead>
                            <tbody>
                                {family.instance_types.into_iter().map(|inst| {
                                    let inst_name = inst.name.clone();
                                    let accel_name = inst.accelerator.as_ref()
                                        .map(|a| a.device_name.clone())
                                        .unwrap_or_else(|| "—".to_string());
                                    let accel_count = inst.accelerator.as_ref()
                                        .map(|a| a.count.to_string())
                                        .unwrap_or_else(|| "—".to_string());
                                    let accel_vram = inst.accelerator.as_ref()
                                        .and_then(|a| a.memory_gb)
                                        .map(|gb| format!("{gb} GB"))
                                        .unwrap_or_else(|| "—".to_string());
                                    let net = inst.network_gbps
                                        .map(|g| format!("{g} Gbps"))
                                        .unwrap_or_else(|| "—".to_string());
                                    let price = inst.price_per_hour_usd
                                        .map(|p| format!("${p:.2}"))
                                        .unwrap_or_else(|| "—".to_string());
                                    let mem = format!("{} GB", inst.memory_gb);
                                    let vcpus = inst.vcpus.to_string();
                                    let supports_mig = inst.accelerator.as_ref()
                                        .is_some_and(|a| a.supports_mig);
                                    view! {
                                        <tr class="instance-row">
                                            <td class="instance-name">
                                                {inst_name}
                                                {if supports_mig {
                                                    Some(view! { <span class="mig-badge" title="Supports Multi-Instance GPU">"MIG"</span> })
                                                } else {
                                                    None
                                                }}
                                            </td>
                                            <td>{vcpus}</td>
                                            <td>{mem}</td>
                                            <td>{accel_name}</td>
                                            <td>{accel_count}</td>
                                            <td>{accel_vram}</td>
                                            <td>{net}</td>
                                            <td class="price">{price}</td>
                                        </tr>
                                    }
                                }).collect::<Vec<_>>()}
                            </tbody>
                        </table>
                    </div>
                }
            }).collect::<Vec<_>>()}
        </div>
    }
}

/// K8s cluster hardware status panel.
#[component]
fn ClusterHardwarePanel(status: ClusterHardwareStatus) -> impl IntoView {
    let provider_label = status
        .detected_provider
        .map(|p| p.label())
        .unwrap_or("Unknown");
    let k8s_status = if status.k8s_connected {
        "Connected"
    } else {
        "Disconnected"
    };
    let k8s_class = if status.k8s_connected {
        "status-badge status-badge--ok"
    } else {
        "status-badge status-badge--error"
    };

    let total_gpus = status.total_gpus;
    let gpu_available = status.gpu_available;
    let has_gpus = total_gpus != 0;
    let total_fpgas = status.total_fpgas;
    let fpga_available = status.fpga_available;
    let has_fpgas = total_fpgas != 0;
    let total_npus = status.total_npus;
    let npu_available = status.npu_available;
    let has_npus = total_npus != 0;
    let total_tpus = status.total_tpus;
    let tpu_available = status.tpu_available;
    let has_tpus = total_tpus != 0;

    view! {
        <div class="cluster-hardware-panel">
            <div class="hw-status-row">
                <span class="hw-label">"K8s Cluster"</span>
                <span class=k8s_class>{k8s_status}</span>
            </div>
            <div class="hw-status-row">
                <span class="hw-label">"Cloud Provider"</span>
                <span class="hw-value">{provider_label}</span>
            </div>

            <h4>"Accelerator Summary"</h4>
            <div class="hw-summary-grid">
                <HardwareSummaryCard
                    label="GPU"
                    total=total_gpus
                    available=gpu_available
                    has_any=has_gpus
                />
                <HardwareSummaryCard
                    label="FPGA"
                    total=total_fpgas
                    available=fpga_available
                    has_any=has_fpgas
                />
                <HardwareSummaryCard
                    label="NPU"
                    total=total_npus
                    available=npu_available
                    has_any=has_npus
                />
                <HardwareSummaryCard
                    label="TPU"
                    total=total_tpus
                    available=tpu_available
                    has_any=has_tpus
                />
            </div>

            <h4>"Node Details"</h4>
            <div class="node-list">
                {status.nodes.into_iter().map(|node| {
                    let node_name = node.node_name.clone();
                    let node_title = node.node_name.clone();
                    let instance_type = node.provider_instance_type.clone()
                        .unwrap_or_else(|| "unknown".to_string());
                    let cpu = node.cpu_allocatable.clone();
                    let mem_gb = node.memory_allocatable_bytes / (1024 * 1024 * 1024);
                    let has_accel = !node.accelerators.is_empty();
                    view! {
                        <div class={if has_accel { "node-card node-card--accelerated" } else { "node-card" }}>
                            <div class="node-card-header">
                                <span class="node-name" title=node_title>{node_name}</span>
                                <span class="node-instance-type">{instance_type}</span>
                            </div>
                            <div class="node-card-resources">
                                <span>{format!("{cpu} vCPU")}</span>
                                <span>{format!("{mem_gb} GB RAM")}</span>
                            </div>
                            {if has_accel {
                                Some(view! {
                                    <div class="node-accelerators">
                                        {node.accelerators.into_iter().map(|accel| {
                                            let badge = accel.accelerator_type.badge();
                                            let device = accel.device_name.clone()
                                                .unwrap_or_else(|| accel.resource_name.clone());
                                            let usage = format!("{}/{} allocated", accel.allocated, accel.allocatable);
                                            view! {
                                                <div class="accel-chip">
                                                    <span class="accel-badge">{badge}</span>
                                                    <span class="accel-device">{device}</span>
                                                    <span class="accel-usage">{usage}</span>
                                                </div>
                                            }
                                        }).collect::<Vec<_>>()}
                                    </div>
                                })
                            } else {
                                None
                            }}
                        </div>
                    }
                }).collect::<Vec<_>>()}
            </div>

            {status.error.map(|err| {
                view! {
                    <div class="hw-error">
                        <p>{err}</p>
                    </div>
                }
            })}
        </div>
    }
}

/// Single accelerator summary card.
#[component]
fn HardwareSummaryCard(
    label: &'static str,
    total: u32,
    available: u32,
    has_any: bool,
) -> impl IntoView {
    let card_class = if has_any {
        "hw-summary-card hw-summary-card--available"
    } else {
        "hw-summary-card hw-summary-card--none"
    };
    view! {
        <div class=card_class>
            <div class="hw-card-label">{label}</div>
            <div class="hw-card-total">{total}</div>
            <div class="hw-card-avail">{format!("{available} free")}</div>
        </div>
    }
}

/// CRD YAML output panel with copy button.
#[component]
fn CrdYamlPanel(yaml: String) -> impl IntoView {
    view! {
        <div class="crd-yaml-panel">
            <div class="yaml-header">
                <h4>"Generated MegaDB CRD"</h4>
            </div>
            <pre class="yaml-content"><code>{yaml}</code></pre>
        </div>
    }
}
