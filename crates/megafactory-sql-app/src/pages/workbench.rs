use leptos::prelude::*;
use megafactory_sql_types::advisor::{
    AcceleratorBackend, BackendOption, HardwareProfile, OperatorAnalysis, Recommendation,
    RecommendationCategory, StrategyComparison, WorkbenchResult,
};
use megafactory_sql_types::toast::ToastLevel;

use crate::components::codemirror::CodeMirrorEditor;
use crate::state::toast::{push_toast, use_toast_write};

/// Mock workbench analysis for Phase A (heuristic, no live MegaDB connection).
/// Will be replaced by a server function calling MegaDB's EXPLAIN + profiling APIs.
#[cfg(feature = "ssr")]
fn mock_analyze(sql: &str) -> WorkbenchResult {
    use megafactory_sql_types::advisor::{AccelerableOp, SimdLevel};

    let is_aggregate = sql.to_uppercase().contains("GROUP BY")
        || sql.to_uppercase().contains("SUM(")
        || sql.to_uppercase().contains("COUNT(");
    let is_graph = sql.to_uppercase().contains("GRAPH MATCH");
    let is_vector = sql.to_uppercase().contains("<->");
    let is_cost_fn = sql.to_uppercase().contains("COST_ANOMALY_SCORE")
        || sql.to_uppercase().contains("COST_FORECAST");

    let hw = HardwareProfile {
        gpu_count: 2,
        gpu_total_vram_bytes: 160 * 1024 * 1024 * 1024,
        gpu_device_name: Some("NVIDIA A100-SXM4-80GB".into()),
        gpu_compute_capability: Some((8, 0)),
        fpga_available: true,
        fpga_device_name: Some("Xilinx Alveo U250".into()),
        npu_available: true,
        simd_level: SimdLevel::Avx2,
        cpu_batch_size: 8192,
        gpu_batch_size: 65536,
        gpu_offload_threshold_rows: 100_000,
    };

    let mut operators = Vec::new();
    let mut recommendations = Vec::new();

    // Parquet scan with FPGA decompression
    operators.push(OperatorAnalysis {
        operator_name: "ParquetScan".into(),
        op_type: Some(AccelerableOp::Decompression),
        estimated_rows: 1_200_000_000,
        recommended_backend: AcceleratorBackend::Fpga,
        backend_options: vec![
            BackendOption {
                backend: AcceleratorBackend::Cpu,
                estimated_speedup: 1.0,
                estimated_time_ms: 8500.0,
                estimated_cost_usd: 0.008,
                available: true,
            },
            BackendOption {
                backend: AcceleratorBackend::Fpga,
                estimated_speedup: 5.0,
                estimated_time_ms: 1700.0,
                estimated_cost_usd: 0.012,
                available: true,
            },
        ],
        rationale: "ZSTD decompression offloaded to FPGA at wire speed".into(),
    });

    if is_aggregate {
        operators.push(OperatorAnalysis {
            operator_name: "HashAggregateExec".into(),
            op_type: Some(AccelerableOp::HashAggregate),
            estimated_rows: 1_200_000_000,
            recommended_backend: AcceleratorBackend::Gpu,
            backend_options: vec![
                BackendOption {
                    backend: AcceleratorBackend::Cpu,
                    estimated_speedup: 1.0,
                    estimated_time_ms: 23400.0,
                    estimated_cost_usd: 0.021,
                    available: true,
                },
                BackendOption {
                    backend: AcceleratorBackend::Gpu,
                    estimated_speedup: 9.3,
                    estimated_time_ms: 2516.0,
                    estimated_cost_usd: 0.083,
                    available: true,
                },
            ],
            rationale: "1.2B rows exceeds GPU offload threshold (100K); GPU hash aggregate \
                        provides 9.3x speedup"
                .into(),
        });
        recommendations.push(Recommendation {
            category: RecommendationCategory::HardwareAcceleration,
            title: "Enable GPU for OLAP aggregation".into(),
            description: "Set accelerator.gpu.enable_olap_aggregation = true in MegaDB config"
                .into(),
            actionable_sql: None,
        });
    }

    if is_graph {
        operators.push(OperatorAnalysis {
            operator_name: "GraphTraversalExec".into(),
            op_type: Some(AccelerableOp::GraphTraversal),
            estimated_rows: 5_000_000,
            recommended_backend: AcceleratorBackend::Gpu,
            backend_options: vec![
                BackendOption {
                    backend: AcceleratorBackend::Cpu,
                    estimated_speedup: 1.0,
                    estimated_time_ms: 12000.0,
                    estimated_cost_usd: 0.011,
                    available: true,
                },
                BackendOption {
                    backend: AcceleratorBackend::Gpu,
                    estimated_speedup: 45.0,
                    estimated_time_ms: 267.0,
                    estimated_cost_usd: 0.035,
                    available: true,
                },
            ],
            rationale: "GPU BFS with CSR format provides 45x speedup on large graphs".into(),
        });
    }

    if is_vector {
        operators.push(OperatorAnalysis {
            operator_name: "VectorDistanceExec".into(),
            op_type: Some(AccelerableOp::VectorDistance),
            estimated_rows: 10_000_000,
            recommended_backend: AcceleratorBackend::Gpu,
            backend_options: vec![
                BackendOption {
                    backend: AcceleratorBackend::Cpu,
                    estimated_speedup: 1.0,
                    estimated_time_ms: 450.0,
                    estimated_cost_usd: 0.0004,
                    available: true,
                },
                BackendOption {
                    backend: AcceleratorBackend::Gpu,
                    estimated_speedup: 50.0,
                    estimated_time_ms: 9.0,
                    estimated_cost_usd: 0.001,
                    available: true,
                },
            ],
            rationale: "cuBLAS batch cosine similarity provides 50x speedup".into(),
        });
    }

    if is_cost_fn {
        operators.push(OperatorAnalysis {
            operator_name: "CostAnalyticsExec".into(),
            op_type: Some(AccelerableOp::CostAnalytics),
            estimated_rows: 500_000,
            recommended_backend: AcceleratorBackend::Npu,
            backend_options: vec![
                BackendOption {
                    backend: AcceleratorBackend::Cpu,
                    estimated_speedup: 1.0,
                    estimated_time_ms: 1200.0,
                    estimated_cost_usd: 0.001,
                    available: true,
                },
                BackendOption {
                    backend: AcceleratorBackend::Npu,
                    estimated_speedup: 8.0,
                    estimated_time_ms: 150.0,
                    estimated_cost_usd: 0.002,
                    available: true,
                },
            ],
            rationale: "ONNX Runtime with CUDA EP provides 8x inference speedup".into(),
        });
    }

    // If no special operators detected, add a generic filter
    if operators.len() == 1 {
        operators.push(OperatorAnalysis {
            operator_name: "FilterExec".into(),
            op_type: Some(AccelerableOp::Filter),
            estimated_rows: 1_200_000_000,
            recommended_backend: AcceleratorBackend::Cpu,
            backend_options: vec![BackendOption {
                backend: AcceleratorBackend::Cpu,
                estimated_speedup: 1.0,
                estimated_time_ms: 3200.0,
                estimated_cost_usd: 0.003,
                available: true,
            }],
            rationale: "Simple predicate evaluation — CPU/SIMD is optimal".into(),
        });
    }

    // Build strategies
    let cpu_time: f64 = operators
        .iter()
        .map(|o| {
            o.backend_options
                .first()
                .map(|b| b.estimated_time_ms)
                .unwrap_or(0.0)
        })
        .sum();
    let cpu_cost: f64 = operators
        .iter()
        .map(|o| {
            o.backend_options
                .first()
                .map(|b| b.estimated_cost_usd)
                .unwrap_or(0.0)
        })
        .sum();

    let accel_time: f64 = operators
        .iter()
        .map(|o| {
            o.backend_options
                .last()
                .map(|b| b.estimated_time_ms)
                .unwrap_or(0.0)
        })
        .sum();
    let accel_cost: f64 = operators
        .iter()
        .map(|o| {
            o.backend_options
                .last()
                .map(|b| b.estimated_cost_usd)
                .unwrap_or(0.0)
        })
        .sum();

    let speedup = if accel_time > 0.0 {
        cpu_time / accel_time
    } else {
        1.0
    };

    let break_even = if accel_cost > cpu_cost && cpu_time > accel_time {
        let cost_diff = accel_cost - cpu_cost;
        let time_saved_hours = (cpu_time - accel_time) / 1000.0 / 3600.0;
        if time_saved_hours > 0.0 {
            Some(cost_diff / time_saved_hours)
        } else {
            None
        }
    } else {
        None
    };

    let strategies = vec![
        StrategyComparison {
            name: "CPU-only".into(),
            description: "All operators on CPU with SIMD".into(),
            total_estimated_time_ms: cpu_time,
            total_estimated_cost_usd: cpu_cost,
            overall_speedup: 1.0,
            operator_backends: operators
                .iter()
                .map(|o| (o.operator_name.clone(), AcceleratorBackend::Cpu))
                .collect(),
            break_even_queries_per_hour: None,
        },
        StrategyComparison {
            name: "Accelerated".into(),
            description: "Optimal hardware per operator".into(),
            total_estimated_time_ms: accel_time,
            total_estimated_cost_usd: accel_cost,
            overall_speedup: speedup,
            operator_backends: operators
                .iter()
                .map(|o| (o.operator_name.clone(), o.recommended_backend))
                .collect(),
            break_even_queries_per_hour: break_even,
        },
    ];

    WorkbenchResult {
        sql: sql.to_string(),
        explain_text: Some(
            "HashAggregateExec: SUM(cost) GROUP BY service\n  \
             FilterExec: billing_period = '2026-01'\n    \
             ParquetScan: aws_cur (1.2B rows, ZSTD compressed)"
                .to_string(),
        ),
        hardware_profile: hw,
        operator_analyses: operators,
        strategies,
        recommended_strategy_index: 1,
        recommendations,
    }
}

#[server(AnalyzeQuery, "/api")]
pub async fn analyze_query(sql: String) -> Result<WorkbenchResult, ServerFnError> {
    Ok(mock_analyze(&sql))
}

/// Algorithm Workbench — SQL analysis with hardware acceleration recommendations.
#[component]
pub fn WorkbenchPage() -> impl IntoView {
    let toast = use_toast_write();
    let (sql, set_sql) = signal(String::from(
        "SELECT service_name, region, SUM(unblended_cost) as total\n\
         FROM aws_cur\n\
         WHERE billing_period = '2026-01'\n\
         GROUP BY service_name, region\n\
         ORDER BY total DESC;",
    ));
    let (result, set_result) = signal(Option::<WorkbenchResult>::None);
    let (is_analyzing, set_analyzing) = signal(false);

    let analyze_action = Action::new(move |sql: &String| {
        let sql = sql.clone();
        async move { analyze_query(sql).await }
    });

    Effect::new(move || {
        if let Some(res) = analyze_action.value().get() {
            set_analyzing.set(false);
            match res {
                Ok(r) => {
                    push_toast(
                        toast,
                        ToastLevel::Success,
                        format!(
                            "Analysis complete: {} operators, {} strategies",
                            r.operator_analyses.len(),
                            r.strategies.len()
                        ),
                    );
                    set_result.set(Some(r));
                }
                Err(e) => {
                    push_toast(toast, ToastLevel::Error, e.to_string());
                }
            }
        }
    });

    let on_analyze = Callback::new(move |s: String| {
        set_sql.set(s.clone());
        set_analyzing.set(true);
        analyze_action.dispatch(s);
    });

    let on_sql_change = Callback::new(move |s: String| {
        set_sql.set(s);
    });

    view! {
        <div class="workbench-page">
            <div class="workbench-header">
                <h2>"Algorithm Workbench"</h2>
                <span class="workbench-subtitle">"Analyze queries and recommend hardware acceleration strategies"</span>
            </div>

            <div class="workbench-editor">
                <CodeMirrorEditor
                    initial_content=sql.get_untracked()
                    on_execute=on_analyze
                    on_change=on_sql_change
                />
                <div class="editor-toolbar">
                    <button
                        class="btn btn-primary"
                        disabled=move || is_analyzing.get()
                        on:click=move |_| on_analyze.run(sql.get())
                    >
                        {move || if is_analyzing.get() { "Analyzing..." } else { "Analyze (Ctrl+Enter)" }}
                    </button>
                </div>
            </div>

            {move || result.get().map(|r| view! {
                <div class="workbench-results">
                    <HardwareProfilePanel profile=r.hardware_profile.clone() />
                    <OperatorAnalysisPanel operators=r.operator_analyses.clone() />
                    <StrategyComparisonPanel
                        strategies=r.strategies.clone()
                        recommended=r.recommended_strategy_index
                    />
                    <RecommendationsPanel recommendations=r.recommendations.clone() />
                </div>
            })}
        </div>
    }
}

#[component]
fn HardwareProfilePanel(profile: HardwareProfile) -> impl IntoView {
    view! {
        <div class="workbench-panel">
            <h3>"Hardware Profile"</h3>
            <div class="hw-profile-grid">
                <div class="hw-item">
                    <span class="hw-label">"GPU"</span>
                    <span class="hw-value">{
                        if profile.gpu_count > 0 {
                            format!("{}x {} ({} GB)",
                                profile.gpu_count,
                                profile.gpu_device_name.as_deref().unwrap_or("Unknown"),
                                profile.gpu_total_vram_bytes / (1024 * 1024 * 1024))
                        } else {
                            "Not available".to_string()
                        }
                    }</span>
                </div>
                <div class="hw-item">
                    <span class="hw-label">"FPGA"</span>
                    <span class="hw-value">{
                        if profile.fpga_available {
                            profile.fpga_device_name.as_deref().unwrap_or("Available").to_string()
                        } else {
                            "Not available".to_string()
                        }
                    }</span>
                </div>
                <div class="hw-item">
                    <span class="hw-label">"NPU"</span>
                    <span class="hw-value">{
                        if profile.npu_available { "ONNX Runtime" } else { "Not available" }
                    }</span>
                </div>
                <div class="hw-item">
                    <span class="hw-label">"SIMD"</span>
                    <span class="hw-value">{profile.simd_level.label()}</span>
                </div>
                <div class="hw-item">
                    <span class="hw-label">"Batch Size"</span>
                    <span class="hw-value">{format!("CPU: {} / GPU: {}", profile.cpu_batch_size, profile.gpu_batch_size)}</span>
                </div>
                <div class="hw-item">
                    <span class="hw-label">"GPU Threshold"</span>
                    <span class="hw-value">{format!("{} rows", profile.gpu_offload_threshold_rows)}</span>
                </div>
            </div>
        </div>
    }
}

#[component]
fn OperatorAnalysisPanel(operators: Vec<OperatorAnalysis>) -> impl IntoView {
    view! {
        <div class="workbench-panel">
            <h3>"Operator Analysis"</h3>
            <table class="workbench-table">
                <thead>
                    <tr>
                        <th>"Operator"</th>
                        <th>"Type"</th>
                        <th>"Est. Rows"</th>
                        <th>"Recommended"</th>
                        <th>"Speedup"</th>
                        <th>"Rationale"</th>
                    </tr>
                </thead>
                <tbody>
                    {operators.into_iter().map(|op| {
                        let best = op.backend_options.iter()
                            .max_by(|a, b| a.estimated_speedup.partial_cmp(&b.estimated_speedup).unwrap_or(std::cmp::Ordering::Equal));
                        let speedup = best.map(|b| b.estimated_speedup).unwrap_or(1.0);
                        let op_name = op.operator_name.clone();
                        let op_type_label = op.op_type.map(|t| t.label()).unwrap_or("—").to_string();
                        let rows_str = format_rows(op.estimated_rows);
                        let badge_class = format!("badge badge--{}", op.recommended_backend.badge().to_lowercase());
                        let badge_text = op.recommended_backend.badge().to_string();
                        let speedup_str = format!("{:.1}x", speedup);
                        let rationale = op.rationale.clone();
                        view! {
                            <tr>
                                <td class="op-name">{op_name}</td>
                                <td>{op_type_label}</td>
                                <td class="numeric">{rows_str}</td>
                                <td>
                                    <span class=badge_class>{badge_text}</span>
                                </td>
                                <td class="numeric">{speedup_str}</td>
                                <td class="rationale">{rationale}</td>
                            </tr>
                        }
                    }).collect_view()}
                </tbody>
            </table>
        </div>
    }
}

#[component]
fn StrategyComparisonPanel(
    strategies: Vec<StrategyComparison>,
    recommended: usize,
) -> impl IntoView {
    view! {
        <div class="workbench-panel">
            <h3>"Strategy Comparison"</h3>
            <table class="workbench-table">
                <thead>
                    <tr>
                        <th>"Strategy"</th>
                        <th>"Est. Time"</th>
                        <th>"Est. Cost"</th>
                        <th>"Speedup"</th>
                        <th>"Break-Even"</th>
                        <th>"Backends"</th>
                    </tr>
                </thead>
                <tbody>
                    {strategies.into_iter().enumerate().map(|(i, s)| {
                        let row_class = if i == recommended { "strategy-row strategy-row--recommended" } else { "strategy-row" };
                        let name = s.name.clone();
                        let is_rec = i == recommended;
                        let time_str = format_time_ms(s.total_estimated_time_ms);
                        let cost_str = format!("${:.4}", s.total_estimated_cost_usd);
                        let speedup_str = format!("{:.1}x", s.overall_speedup);
                        let break_even_str = s.break_even_queries_per_hour
                            .map(|b| format!("{:.0} qry/hr", b))
                            .unwrap_or_else(|| "—".into());
                        let backends_str = s.operator_backends.iter()
                            .map(|(op, backend)| format!("{}: {}", short_op_name(op), backend.badge()))
                            .collect::<Vec<_>>()
                            .join(", ");
                        view! {
                            <tr class=row_class>
                                <td>
                                    {name}
                                    {if is_rec {
                                        Some(view! { <span class="badge badge--recommended">"Recommended"</span> })
                                    } else {
                                        None
                                    }}
                                </td>
                                <td class="numeric">{time_str}</td>
                                <td class="numeric">{cost_str}</td>
                                <td class="numeric">{speedup_str}</td>
                                <td class="numeric">{break_even_str}</td>
                                <td class="backends">{backends_str}</td>
                            </tr>
                        }
                    }).collect_view()}
                </tbody>
            </table>
        </div>
    }
}

#[component]
fn RecommendationsPanel(recommendations: Vec<Recommendation>) -> impl IntoView {
    if recommendations.is_empty() {
        return view! { <div></div> }.into_any();
    }
    view! {
        <div class="workbench-panel">
            <h3>"Recommendations"</h3>
            <div class="recommendations-list">
                {recommendations.into_iter().map(|r| {
                    let cat = r.category.label().to_string();
                    let title = r.title.clone();
                    let desc = r.description.clone();
                    view! {
                        <div class="recommendation-card">
                            <span class="recommendation-category">{cat}</span>
                            <h4>{title}</h4>
                            <p>{desc}</p>
                            {r.actionable_sql.map(|sql| view! {
                                <pre class="recommendation-sql">{sql}</pre>
                            })}
                        </div>
                    }
                }).collect_view()}
            </div>
        </div>
    }
    .into_any()
}

fn format_rows(n: u64) -> String {
    if n >= 1_000_000_000 {
        format!("{:.1}B", n as f64 / 1_000_000_000.0)
    } else if n >= 1_000_000 {
        format!("{:.1}M", n as f64 / 1_000_000.0)
    } else if n >= 1_000 {
        format!("{:.1}K", n as f64 / 1_000.0)
    } else {
        n.to_string()
    }
}

fn format_time_ms(ms: f64) -> String {
    if ms >= 1000.0 {
        format!("{:.1}s", ms / 1000.0)
    } else {
        format!("{:.0}ms", ms)
    }
}

fn short_op_name(name: &str) -> &str {
    name.strip_suffix("Exec")
        .or_else(|| name.strip_suffix("Scan"))
        .unwrap_or(name)
}
