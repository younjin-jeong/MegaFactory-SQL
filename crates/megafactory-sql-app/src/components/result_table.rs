use leptos::prelude::*;
use megafactory_sql_types::query::QueryResult;
use megafactory_sql_types::toast::ToastLevel;

use crate::state::toast::{push_toast, use_toast_write};

/// Result table for query output with CSV/JSON export.
#[component]
pub fn ResultTable(result: Signal<Option<QueryResult>>) -> impl IntoView {
    let toast = use_toast_write();

    view! {
        <div class="result-table-container">
            {move || match result.get() {
                None => view! {
                    <div class="result-table-empty">
                        <p>"Run a query to see results"</p>
                    </div>
                }.into_any(),
                Some(ref r) if r.error.is_some() => view! {
                    <div class="result-table-error">
                        <p class="error-message">{r.error.clone().unwrap_or_default()}</p>
                    </div>
                }.into_any(),
                Some(ref r) => {
                    let r_csv = r.clone();
                    let r_json = r.clone();
                    view! {
                        <div class="result-table-wrapper">
                            <div class="result-table-header">
                                <span class="result-count">
                                    {format!("{} rows", r.row_count)}
                                </span>
                                <span class="result-time">
                                    {format!("{}ms", r.execution_time_ms)}
                                </span>
                                <div class="result-actions">
                                    <button
                                        class="btn btn-sm"
                                        title="Export CSV"
                                        on:click=move |_| {
                                            export_csv(&r_csv);
                                            push_toast(toast, ToastLevel::Success, "Exported as CSV");
                                        }
                                    >
                                        "CSV"
                                    </button>
                                    <button
                                        class="btn btn-sm"
                                        title="Export JSON"
                                        on:click=move |_| {
                                            export_json(&r_json);
                                            push_toast(toast, ToastLevel::Success, "Exported as JSON");
                                        }
                                    >
                                        "JSON"
                                    </button>
                                </div>
                            </div>
                            <div class="result-table-scroll">
                                <table class="result-table">
                                    <thead>
                                        <tr>
                                            {r.columns.iter().map(|col| {
                                                let name = col.name.clone();
                                                let dtype = col.data_type.clone();
                                                let dtype2 = dtype.clone();
                                                view! {
                                                    <th title=dtype>
                                                        <span class="col-name">{name}</span>
                                                        <span class="col-type">{dtype2}</span>
                                                    </th>
                                                }
                                            }).collect::<Vec<_>>()}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {r.rows.iter().take(1000).enumerate().map(|(i, row)| {
                                            view! {
                                                <tr class=if i % 2 == 0 { "row-even" } else { "row-odd" }>
                                                    {row.iter().map(|val| {
                                                        let display = format_value(val);
                                                        let display2 = display.clone();
                                                        view! {
                                                            <td title=display>{display2}</td>
                                                        }
                                                    }).collect::<Vec<_>>()}
                                                </tr>
                                            }
                                        }).collect::<Vec<_>>()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    }.into_any()
                },
            }}
        </div>
    }
}

fn format_value(val: &serde_json::Value) -> String {
    match val {
        serde_json::Value::Null => "NULL".to_string(),
        serde_json::Value::String(s) => s.clone(),
        serde_json::Value::Number(n) => n.to_string(),
        serde_json::Value::Bool(b) => b.to_string(),
        other => other.to_string(),
    }
}

fn escape_csv(s: &str) -> String {
    if s.contains(',') || s.contains('"') || s.contains('\n') {
        format!("\"{}\"", s.replace('"', "\"\""))
    } else {
        s.to_string()
    }
}

fn export_csv(result: &QueryResult) {
    let mut csv = String::new();
    // Header
    csv.push_str(
        &result
            .columns
            .iter()
            .map(|c| escape_csv(&c.name))
            .collect::<Vec<_>>()
            .join(","),
    );
    csv.push('\n');
    // Rows
    for row in &result.rows {
        csv.push_str(
            &row.iter()
                .map(|v| escape_csv(&format_value(v)))
                .collect::<Vec<_>>()
                .join(","),
        );
        csv.push('\n');
    }
    trigger_download(&csv, "query-result.csv", "text/csv");
}

fn export_json(result: &QueryResult) {
    let objects: Vec<serde_json::Value> = result
        .rows
        .iter()
        .map(|row| {
            let mut obj = serde_json::Map::new();
            for (i, col) in result.columns.iter().enumerate() {
                obj.insert(
                    col.name.clone(),
                    row.get(i).cloned().unwrap_or(serde_json::Value::Null),
                );
            }
            serde_json::Value::Object(obj)
        })
        .collect();
    let json = serde_json::to_string_pretty(&objects).unwrap_or_default();
    trigger_download(&json, "query-result.json", "application/json");
}

#[cfg(target_arch = "wasm32")]
fn trigger_download(content: &str, filename: &str, mime_type: &str) {
    use wasm_bindgen::prelude::*;

    let window = match web_sys::window() {
        Some(w) => w,
        None => return,
    };
    let document = match window.document() {
        Some(d) => d,
        None => return,
    };

    let blob_parts = js_sys::Array::new();
    blob_parts.push(&JsValue::from_str(content));
    let mut opts = web_sys::BlobPropertyBag::new();
    opts.type_(mime_type);
    let blob = match web_sys::Blob::new_with_str_sequence_and_options(&blob_parts, &opts) {
        Ok(b) => b,
        Err(_) => return,
    };
    let url = match web_sys::Url::create_object_url_with_blob(&blob) {
        Ok(u) => u,
        Err(_) => return,
    };

    if let Ok(element) = document.create_element("a") {
        let a: web_sys::HtmlAnchorElement = element.unchecked_into();
        a.set_href(&url);
        a.set_download(filename);
        a.click();
        let _ = web_sys::Url::revoke_object_url(&url);
    }
}

#[cfg(not(target_arch = "wasm32"))]
fn trigger_download(_content: &str, _filename: &str, _mime_type: &str) {
    // No-op on server
}
