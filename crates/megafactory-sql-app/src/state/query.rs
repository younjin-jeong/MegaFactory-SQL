use leptos::prelude::*;
use megafactory_sql_types::query::{QueryHistoryEntry, QueryResult};

const MAX_HISTORY: usize = 100;

/// State for a single query tab.
#[derive(Debug, Clone)]
pub struct QueryTab {
    pub id: uuid::Uuid,
    pub title: String,
    pub sql: String,
    pub result: Option<QueryResult>,
    pub is_running: bool,
}

impl QueryTab {
    pub fn new() -> Self {
        Self {
            id: uuid::Uuid::new_v4(),
            title: "New Query".to_string(),
            sql: String::new(),
            result: None,
            is_running: false,
        }
    }

    pub fn with_title(mut self, title: impl Into<String>) -> Self {
        self.title = title.into();
        self
    }
}

impl Default for QueryTab {
    fn default() -> Self {
        Self::new()
    }
}

/// Global query state: tabs, active tab, history.
#[derive(Debug, Clone)]
pub struct QueryState {
    pub tabs: Vec<QueryTab>,
    pub active_tab_index: usize,
    pub history: Vec<QueryHistoryEntry>,
}

impl QueryState {
    /// Load history from localStorage, create default tab.
    pub fn load() -> Self {
        let history =
            crate::storage::get::<Vec<QueryHistoryEntry>>(crate::storage::keys::QUERY_HISTORY)
                .unwrap_or_default();
        Self {
            tabs: vec![QueryTab::new().with_title("Query 1")],
            active_tab_index: 0,
            history,
        }
    }

    pub fn active_tab(&self) -> &QueryTab {
        &self.tabs[self.active_tab_index]
    }

    pub fn active_tab_mut(&mut self) -> &mut QueryTab {
        &mut self.tabs[self.active_tab_index]
    }

    pub fn add_tab(&mut self) {
        let num = self.tabs.len() + 1;
        self.tabs
            .push(QueryTab::new().with_title(format!("Query {num}")));
        self.active_tab_index = self.tabs.len() - 1;
    }

    pub fn close_tab(&mut self, index: usize) {
        if self.tabs.len() <= 1 {
            return;
        }
        self.tabs.remove(index);
        if self.active_tab_index >= self.tabs.len() {
            self.active_tab_index = self.tabs.len() - 1;
        }
    }

    /// Push a history entry, cap at MAX_HISTORY, and persist.
    pub fn push_history(&mut self, entry: QueryHistoryEntry) {
        self.history.push(entry);
        if self.history.len() > MAX_HISTORY {
            self.history.remove(0);
        }
        crate::storage::set(crate::storage::keys::QUERY_HISTORY, &self.history);
    }
}

impl Default for QueryState {
    fn default() -> Self {
        Self::load()
    }
}

/// Provide query state as a context.
pub fn provide_query_state() {
    let state = signal(QueryState::load());
    provide_context(state);
}

/// Use query state from context.
pub fn use_query_state() -> (ReadSignal<QueryState>, WriteSignal<QueryState>) {
    expect_context::<(ReadSignal<QueryState>, WriteSignal<QueryState>)>()
}
