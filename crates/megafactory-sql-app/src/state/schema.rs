use leptos::prelude::*;
use megafactory_sql_types::schema::{DatabaseInfo, TableInfo};

/// Global schema browser state.
#[derive(Debug, Clone, Default)]
pub struct SchemaState {
    pub databases: Vec<DatabaseInfo>,
    pub selected_table: Option<TableInfo>,
    pub is_loading: bool,
    pub filter_text: String,
}

pub fn provide_schema_state() {
    let state = signal(SchemaState::default());
    provide_context(state);
}

pub fn use_schema_state() -> (ReadSignal<SchemaState>, WriteSignal<SchemaState>) {
    expect_context::<(ReadSignal<SchemaState>, WriteSignal<SchemaState>)>()
}
