use leptos::prelude::*;
use megafactory_sql_types::schema::*;

use crate::components::schema_tree::SchemaTree;

/// Server function to list databases and schemas.
/// Returns mock data in Phase 1.
#[server(ListDatabases, "/api")]
pub async fn list_databases() -> Result<Vec<DatabaseInfo>, ServerFnError> {
    Ok(vec![DatabaseInfo {
        name: "megadb".to_string(),
        default_engine: "OLAP".to_string(),
        schemas: vec![SchemaInfo {
            name: "public".to_string(),
            tables: vec![
                TableInfo {
                    schema_name: "public".to_string(),
                    name: "cur_data".to_string(),
                    engine: "OLAP".to_string(),
                    row_count: Some(1_247_832_456),
                    size_bytes: Some(12_400_000_000),
                    columns: vec![
                        ColumnInfo {
                            name: "line_item_id".into(),
                            data_type: "VARCHAR".into(),
                            nullable: false,
                            comment: None,
                        },
                        ColumnInfo {
                            name: "account_id".into(),
                            data_type: "VARCHAR".into(),
                            nullable: false,
                            comment: None,
                        },
                        ColumnInfo {
                            name: "service_name".into(),
                            data_type: "VARCHAR".into(),
                            nullable: false,
                            comment: None,
                        },
                        ColumnInfo {
                            name: "cost".into(),
                            data_type: "DECIMAL(18,6)".into(),
                            nullable: false,
                            comment: Some("Unblended cost in USD".into()),
                        },
                        ColumnInfo {
                            name: "region".into(),
                            data_type: "VARCHAR".into(),
                            nullable: true,
                            comment: None,
                        },
                        ColumnInfo {
                            name: "billing_period".into(),
                            data_type: "DATE".into(),
                            nullable: false,
                            comment: None,
                        },
                    ],
                    partitions: vec![PartitionInfo {
                        column: "billing_period".into(),
                        transform: "month".into(),
                    }],
                    compression: Some("Zstd".into()),
                    sort_columns: Some(vec!["account_id".into(), "service_name".into()]),
                },
                TableInfo {
                    schema_name: "public".to_string(),
                    name: "cmdb_resources".to_string(),
                    engine: "OLTP".to_string(),
                    row_count: Some(45_230),
                    size_bytes: Some(8_500_000),
                    columns: vec![
                        ColumnInfo {
                            name: "resource_id".into(),
                            data_type: "VARCHAR".into(),
                            nullable: false,
                            comment: None,
                        },
                        ColumnInfo {
                            name: "resource_type".into(),
                            data_type: "VARCHAR".into(),
                            nullable: false,
                            comment: None,
                        },
                        ColumnInfo {
                            name: "tags".into(),
                            data_type: "JSONB".into(),
                            nullable: true,
                            comment: None,
                        },
                    ],
                    partitions: vec![],
                    compression: None,
                    sort_columns: None,
                },
                TableInfo {
                    schema_name: "public".to_string(),
                    name: "cost_alerts".to_string(),
                    engine: "MEMORY".to_string(),
                    row_count: Some(128),
                    size_bytes: Some(64_000),
                    columns: vec![
                        ColumnInfo {
                            name: "alert_id".into(),
                            data_type: "UUID".into(),
                            nullable: false,
                            comment: None,
                        },
                        ColumnInfo {
                            name: "threshold".into(),
                            data_type: "DECIMAL(18,2)".into(),
                            nullable: false,
                            comment: None,
                        },
                        ColumnInfo {
                            name: "triggered_at".into(),
                            data_type: "TIMESTAMP".into(),
                            nullable: true,
                            comment: None,
                        },
                    ],
                    partitions: vec![],
                    compression: None,
                    sort_columns: None,
                },
            ],
        }],
    }])
}

/// Schema Browser page.
#[component]
pub fn SchemaBrowserPage() -> impl IntoView {
    let databases = Resource::new(|| (), |_| list_databases());
    let (selected_table, set_selected_table) = signal(Option::<TableInfo>::None);
    let (filter, set_filter) = signal(String::new());

    let on_select = Callback::new(move |table: TableInfo| {
        set_selected_table.set(Some(table));
    });

    view! {
        <div class="schema-browser-page">
            <div class="schema-sidebar">
                <div class="schema-filter">
                    <input
                        type="text"
                        class="input"
                        placeholder="Filter tables..."
                        prop:value=move || filter.get()
                        on:input=move |ev| set_filter.set(event_target_value(&ev))
                    />
                </div>
                <Suspense fallback=|| view! { <p>"Loading schemas..."</p> }>
                    {move || {
                        databases.get().map(|result| {
                            match result {
                                Ok(dbs) => {
                                    let dbs_signal = Signal::derive(move || dbs.clone());
                                    let filter_signal = Signal::from(filter);
                                    view! {
                                        <SchemaTree
                                            databases=dbs_signal
                                            on_select_table=on_select
                                            filter=filter_signal
                                        />
                                    }.into_any()
                                }
                                Err(e) => view! {
                                    <p class="error">{format!("Error: {e}")}</p>
                                }.into_any(),
                            }
                        })
                    }}
                </Suspense>
            </div>

            <div class="schema-detail">
                {move || match selected_table.get() {
                    None => view! {
                        <div class="schema-detail-empty">
                            <p>"Select a table to view details"</p>
                        </div>
                    }.into_any(),
                    Some(ref table) => view! {
                        <TableDetail table=table.clone() />
                    }.into_any(),
                }}
            </div>
        </div>
    }
}

#[component]
fn TableDetail(table: TableInfo) -> impl IntoView {
    let size_display = table.size_bytes.map(|b| {
        if b >= 1_000_000_000 {
            format!("{:.1} GB", b as f64 / 1_000_000_000.0)
        } else if b >= 1_000_000 {
            format!("{:.1} MB", b as f64 / 1_000_000.0)
        } else {
            format!("{} KB", b / 1000)
        }
    });

    view! {
        <div class="table-detail">
            <h2>{format!("{}.{}", table.schema_name, table.name)}</h2>

            <div class="table-meta">
                <div class="meta-item">
                    <span class="meta-label">"Engine"</span>
                    <span class=format!("meta-value engine-badge engine-{}", table.engine.to_lowercase())>
                        {table.engine.clone()}
                    </span>
                </div>
                {table.compression.as_ref().map(|c| view! {
                    <div class="meta-item">
                        <span class="meta-label">"Compression"</span>
                        <span class="meta-value">{c.clone()}</span>
                    </div>
                })}
                {table.row_count.map(|c| view! {
                    <div class="meta-item">
                        <span class="meta-label">"Rows"</span>
                        <span class="meta-value">{format_number(c)}</span>
                    </div>
                })}
                {size_display.map(|s| view! {
                    <div class="meta-item">
                        <span class="meta-label">"Size"</span>
                        <span class="meta-value">{s}</span>
                    </div>
                })}
                {table.sort_columns.as_ref().map(|cols| view! {
                    <div class="meta-item">
                        <span class="meta-label">"Sort"</span>
                        <span class="meta-value">{cols.join(", ")}</span>
                    </div>
                })}
            </div>

            {if !table.partitions.is_empty() {
                Some(view! {
                    <div class="table-partitions">
                        <h3>"Partitions"</h3>
                        {table.partitions.iter().map(|p| view! {
                            <span class="partition-badge">
                                {format!("{} ({})", p.column, p.transform)}
                            </span>
                        }).collect::<Vec<_>>()}
                    </div>
                })
            } else {
                None
            }}

            <div class="table-columns">
                <h3>{format!("Columns ({})", table.columns.len())}</h3>
                <table class="columns-table">
                    <thead>
                        <tr>
                            <th>"Name"</th>
                            <th>"Type"</th>
                            <th>"Nullable"</th>
                            <th>"Comment"</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table.columns.iter().map(|col| view! {
                            <tr>
                                <td class="col-name">{col.name.clone()}</td>
                                <td class="col-type">{col.data_type.clone()}</td>
                                <td>{if col.nullable { "YES" } else { "NO" }}</td>
                                <td class="col-comment">{col.comment.clone().unwrap_or_default()}</td>
                            </tr>
                        }).collect::<Vec<_>>()}
                    </tbody>
                </table>
            </div>
        </div>
    }
}

fn format_number(n: u64) -> String {
    let s = n.to_string();
    let mut result = String::new();
    for (i, c) in s.chars().rev().enumerate() {
        if i > 0 && i % 3 == 0 {
            result.push(',');
        }
        result.push(c);
    }
    result.chars().rev().collect()
}
