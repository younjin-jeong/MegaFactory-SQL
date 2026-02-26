use leptos::prelude::*;
use megafactory_sql_types::connection::{ConnectionConfig, ConnectionStatus};

/// Global connection state.
#[derive(Debug, Clone)]
pub struct ConnectionState {
    pub active: Option<ConnectionConfig>,
    pub status: ConnectionStatus,
    pub saved_connections: Vec<ConnectionConfig>,
}

impl ConnectionState {
    /// Load saved connections from localStorage.
    pub fn load() -> Self {
        let saved = crate::storage::get::<Vec<ConnectionConfig>>(crate::storage::keys::CONNECTIONS)
            .unwrap_or_else(|| vec![ConnectionConfig::default()]);
        let active = saved.first().cloned();
        Self {
            active,
            status: ConnectionStatus::Disconnected,
            saved_connections: saved,
        }
    }

    /// Persist saved connections to localStorage.
    fn persist(&self) {
        crate::storage::set(crate::storage::keys::CONNECTIONS, &self.saved_connections);
    }

    /// Add a new connection and persist.
    pub fn add_connection(&mut self, config: ConnectionConfig) {
        self.saved_connections.push(config);
        self.persist();
    }

    /// Update an existing connection by ID and persist.
    pub fn update_connection(&mut self, config: ConnectionConfig) {
        if let Some(existing) = self
            .saved_connections
            .iter_mut()
            .find(|c| c.id == config.id)
        {
            *existing = config;
        }
        self.persist();
    }

    /// Remove a connection by ID and persist.
    pub fn remove_connection(&mut self, id: uuid::Uuid) {
        self.saved_connections.retain(|c| c.id != id);
        if self.active.as_ref().is_some_and(|a| a.id == id) {
            self.active = self.saved_connections.first().cloned();
            self.status = ConnectionStatus::Disconnected;
        }
        self.persist();
    }

    /// Set the active connection.
    pub fn set_active(&mut self, id: uuid::Uuid) {
        self.active = self.saved_connections.iter().find(|c| c.id == id).cloned();
        self.status = ConnectionStatus::Disconnected;
    }
}

impl Default for ConnectionState {
    fn default() -> Self {
        Self::load()
    }
}

pub fn provide_connection_state() {
    let state = signal(ConnectionState::load());
    provide_context(state);
}

pub fn use_connection_state() -> (ReadSignal<ConnectionState>, WriteSignal<ConnectionState>) {
    expect_context::<(ReadSignal<ConnectionState>, WriteSignal<ConnectionState>)>()
}
