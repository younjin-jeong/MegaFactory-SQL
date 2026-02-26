use leptos::prelude::*;

use crate::state::query::use_query_state;

/// Collapsible query history panel.
#[component]
pub fn QueryHistoryPanel(
    show: Signal<bool>,
    #[prop(into)] on_restore: Callback<String>,
    #[prop(into)] on_close: Callback<()>,
) -> impl IntoView {
    let (query_state, _) = use_query_state();

    view! {
        <div
            class="query-history-panel"
            style=move || if show.get() { "" } else { "display:none" }
        >
            <div class="query-history-header">
                <h3>"Query History"</h3>
                <button class="btn btn-sm" on:click=move |_| on_close.run(())>
                    "Close"
                </button>
            </div>
            <div class="query-history-list">
                {move || {
                    let state = query_state.get();
                    if state.history.is_empty() {
                        return vec![view! {
                            <div class="query-history-empty">
                                <p>"No queries yet. Run a query to see it here."</p>
                            </div>
                        }.into_any()];
                    }
                    state.history.iter().rev().map(|entry| {
                        let sql = entry.sql.clone();
                        let sql_for_click = sql.clone();
                        let sql_preview = if sql.len() > 120 {
                            format!("{}...", &sql[..120])
                        } else {
                            sql.clone()
                        };
                        let time_display = entry.executed_at.format("%H:%M:%S").to_string();
                        let duration = format_duration(entry.execution_time_ms);
                        let success = entry.success;
                        let status_class = if success { "history-success" } else { "history-error" };
                        let row_count = entry.row_count;

                        view! {
                            <div
                                class="query-history-entry"
                                on:click=move |_| on_restore.run(sql_for_click.clone())
                                title="Click to restore this query"
                            >
                                <div class="history-meta">
                                    <span class=status_class>
                                        {if success { "OK" } else { "ERR" }}
                                    </span>
                                    <span class="history-time">{time_display}</span>
                                    <span class="history-duration">{duration}</span>
                                    <span class="history-rows">{format!("{row_count} rows")}</span>
                                </div>
                                <pre class="history-sql">{sql_preview}</pre>
                            </div>
                        }.into_any()
                    }).collect::<Vec<_>>()
                }}
            </div>
        </div>
    }
}

fn format_duration(ms: u64) -> String {
    if ms < 1000 {
        format!("{ms}ms")
    } else {
        format!("{:.1}s", ms as f64 / 1000.0)
    }
}
