use leptos::prelude::*;
use megafactory_sql_types::explain::PlanNode;

/// Interactive EXPLAIN query plan visualization.
#[component]
pub fn QueryPlanViewer(plan_text: Signal<Option<String>>) -> impl IntoView {
    view! {
        <div class="query-plan">
            {move || match plan_text.get() {
                None => view! {
                    <p class="query-plan-empty">"Run EXPLAIN to see query plan"</p>
                }.into_any(),
                Some(text) => {
                    // Try parsing as JSON first, then as text
                    let parsed = serde_json::from_str::<serde_json::Value>(&text)
                        .ok()
                        .and_then(|json| PlanNode::parse_json(&json))
                        .or_else(|| PlanNode::parse_text(&text));

                    match parsed {
                        Some(node) => view! {
                            <div class="query-plan-tree">
                                {render_plan_node(&node, 0)}
                            </div>
                        }.into_any(),
                        None => view! {
                            <pre class="query-plan-text">{text}</pre>
                        }.into_any(),
                    }
                },
            }}
        </div>
    }
}

/// Render a plan node tree recursively. Returns AnyView to break type recursion.
fn render_plan_node(node: &PlanNode, depth: usize) -> AnyView {
    let indent = format!("padding-left: {}px", depth * 20);

    let cost_display = if node.cost_total > 0.0 {
        format!("cost={:.0}..{:.0}", node.cost_startup, node.cost_total)
    } else {
        String::new()
    };

    let rows_display = if node.estimated_rows > 0 {
        format!("rows={}", node.estimated_rows)
    } else {
        String::new()
    };

    let time_display = node
        .actual_time_ms
        .map(|t| format!("time={:.2}ms", t))
        .unwrap_or_default();

    let actual_rows_display = node
        .actual_rows
        .map(|r| format!("actual={}", r))
        .unwrap_or_default();

    let relation_display = node.relation.clone().unwrap_or_default();
    let operator = node.operator.clone();
    let has_children = !node.children.is_empty();

    // Pre-render children (not inside a closure, so no Clone needed)
    let children_view: Option<AnyView> = if has_children {
        let children: Vec<AnyView> = node
            .children
            .iter()
            .map(|child| render_plan_node(child, depth + 1))
            .collect();
        Some(
            view! {
                <div class="plan-node-children">
                    {children}
                </div>
            }
            .into_any(),
        )
    } else {
        None
    };

    let arrow_view = if has_children {
        Some(view! {
            <span class="plan-node-arrow">"v"</span>
        })
    } else {
        None
    };

    let relation_view = if !relation_display.is_empty() {
        Some(view! {
            <span class="plan-node-relation">{format!("on {}", relation_display)}</span>
        })
    } else {
        None
    };

    view! {
        <div class="plan-node" style=indent>
            <div class="plan-node-header">
                {arrow_view}
                <span class="plan-node-operator">{operator}</span>
                {relation_view}
            </div>
            <div class="plan-node-badges">
                {if !cost_display.is_empty() {
                    Some(view! { <span class="badge badge--cost">{cost_display}</span> })
                } else {
                    None
                }}
                {if !rows_display.is_empty() {
                    Some(view! { <span class="badge badge--rows">{rows_display}</span> })
                } else {
                    None
                }}
                {if !time_display.is_empty() {
                    Some(view! { <span class="badge badge--time">{time_display}</span> })
                } else {
                    None
                }}
                {if !actual_rows_display.is_empty() {
                    Some(view! { <span class="badge badge--actual">{actual_rows_display}</span> })
                } else {
                    None
                }}
            </div>
            {children_view}
        </div>
    }
    .into_any()
}
