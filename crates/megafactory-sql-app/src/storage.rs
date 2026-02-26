use serde::{de::DeserializeOwned, Serialize};

/// Read a JSON-deserialized value from localStorage.
/// Returns `None` on the server (SSR) or if the key doesn't exist.
pub fn get<T: DeserializeOwned>(key: &str) -> Option<T> {
    let raw = get_raw(key)?;
    serde_json::from_str(&raw).ok()
}

/// Write a JSON-serialized value to localStorage.
/// No-op on the server.
pub fn set<T: Serialize>(key: &str, value: &T) {
    if let Ok(json) = serde_json::to_string(value) {
        set_raw(key, &json);
    }
}

/// Remove a key from localStorage.
/// No-op on the server.
pub fn remove(key: &str) {
    remove_raw(key);
}

// --- Platform-specific implementations ---

#[cfg(target_arch = "wasm32")]
fn get_raw(key: &str) -> Option<String> {
    let storage = web_sys::window()?.local_storage().ok().flatten()?;
    storage.get_item(key).ok().flatten()
}

#[cfg(target_arch = "wasm32")]
fn set_raw(key: &str, value: &str) {
    if let Some(storage) = web_sys::window().and_then(|w| w.local_storage().ok().flatten()) {
        let _ = storage.set_item(key, value);
    }
}

#[cfg(target_arch = "wasm32")]
fn remove_raw(key: &str) {
    if let Some(storage) = web_sys::window().and_then(|w| w.local_storage().ok().flatten()) {
        let _ = storage.remove_item(key);
    }
}

#[cfg(not(target_arch = "wasm32"))]
fn get_raw(_key: &str) -> Option<String> {
    None
}

#[cfg(not(target_arch = "wasm32"))]
fn set_raw(_key: &str, _value: &str) {}

#[cfg(not(target_arch = "wasm32"))]
fn remove_raw(_key: &str) {}

/// Centralized storage key constants.
pub mod keys {
    pub const SETTINGS: &str = "megafactory.settings";
    pub const QUERY_HISTORY: &str = "megafactory.queryHistory";
    pub const CONNECTIONS: &str = "megafactory.connections";
    pub const SIDEBAR_COLLAPSED: &str = "megafactory.sidebarCollapsed";
}
