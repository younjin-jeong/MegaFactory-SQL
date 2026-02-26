use leptos::prelude::*;
use serde::{Deserialize, Serialize};

/// Application-wide settings, persisted to localStorage.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub theme: String,
    pub font_size: u32,
    pub row_limit: u64,
    pub autocomplete: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            font_size: 14,
            row_limit: 1000,
            autocomplete: true,
        }
    }
}

impl AppSettings {
    /// Load from localStorage, falling back to defaults.
    pub fn load() -> Self {
        crate::storage::get::<Self>(crate::storage::keys::SETTINGS).unwrap_or_default()
    }

    /// Save current settings to localStorage.
    pub fn save(&self) {
        crate::storage::set(crate::storage::keys::SETTINGS, self);
    }
}

/// Provide settings state as a context.
pub fn provide_settings_state() {
    let state = signal(AppSettings::load());
    provide_context(state);
}

/// Use settings state from context.
pub fn use_settings_state() -> (ReadSignal<AppSettings>, WriteSignal<AppSettings>) {
    expect_context::<(ReadSignal<AppSettings>, WriteSignal<AppSettings>)>()
}
