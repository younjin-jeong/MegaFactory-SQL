use leptos::prelude::*;
use megafactory_sql_types::schema::{DatabaseInfo, SchemaInfo, TableInfo};

/// Collapsible tree for browsing database schemas.
#[component]
pub fn SchemaTree(
    databases: Signal<Vec<DatabaseInfo>>,
    #[prop(into)] on_select_table: Callback<TableInfo>,
    filter: Signal<String>,
) -> impl IntoView {
    view! {
        <div class="schema-tree">
            {move || {
                let filter_text = filter.get().to_lowercase();
                databases.get().iter().map(|db| {
                    let db_name = db.name.clone();
                    let schemas = db.schemas.clone();
                    view! {
                        <SchemaTreeDatabase
                            name=db_name
                            schemas=schemas
                            filter=filter_text.clone()
                            on_select_table=on_select_table
                        />
                    }
                }).collect::<Vec<_>>()
            }}
        </div>
    }
}

#[component]
fn SchemaTreeDatabase(
    name: String,
    schemas: Vec<SchemaInfo>,
    filter: String,
    #[prop(into)] on_select_table: Callback<TableInfo>,
) -> impl IntoView {
    let (expanded, set_expanded) = signal(true);
    let name_clone = name.clone();

    view! {
        <div class="tree-node tree-database">
            <div class="tree-label" on:click=move |_| set_expanded.update(|v| *v = !*v)>
                <span class="tree-arrow">{move || if expanded.get() { "v" } else { ">" }}</span>
                <span class="tree-icon">"DB"</span>
                <span class="tree-name">{name_clone}</span>
            </div>
            <div class="tree-children" style=move || if expanded.get() { "" } else { "display:none" }>
                {schemas.iter().map(|schema| {
                    let tables: Vec<TableInfo> = schema.tables.iter()
                        .filter(|t| filter.is_empty() || t.name.to_lowercase().contains(&filter))
                        .cloned()
                        .collect();
                    let schema_name = schema.name.clone();
                    view! {
                        <SchemaTreeSchema
                            name=schema_name
                            tables=tables
                            on_select_table=on_select_table
                        />
                    }
                }).collect::<Vec<_>>()}
            </div>
        </div>
    }
}

#[component]
fn SchemaTreeSchema(
    name: String,
    tables: Vec<TableInfo>,
    #[prop(into)] on_select_table: Callback<TableInfo>,
) -> impl IntoView {
    let (expanded, set_expanded) = signal(true);
    let name_clone = name.clone();

    view! {
        <div class="tree-node tree-schema">
            <div class="tree-label" on:click=move |_| set_expanded.update(|v| *v = !*v)>
                <span class="tree-arrow">{move || if expanded.get() { "v" } else { ">" }}</span>
                <span class="tree-icon">"S"</span>
                <span class="tree-name">{name_clone}</span>
                <span class="tree-count">{format!("({})", tables.len())}</span>
            </div>
            <div class="tree-children" style=move || if expanded.get() { "" } else { "display:none" }>
                {tables.iter().map(|table| {
                    let t = table.clone();
                    let table_name = table.name.clone();
                    let engine = table.engine.clone();
                    view! {
                        <div
                            class="tree-node tree-table"
                            on:click=move |_| on_select_table.run(t.clone())
                        >
                            <span class="tree-icon tree-engine-badge">{engine.clone()}</span>
                            <span class="tree-name">{table_name}</span>
                        </div>
                    }
                }).collect::<Vec<_>>()}
            </div>
        </div>
    }
}
