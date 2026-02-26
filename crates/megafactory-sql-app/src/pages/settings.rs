use leptos::prelude::*;
use megafactory_sql_types::toast::ToastLevel;

use crate::state::settings::use_settings_state;
use crate::state::toast::{push_toast, use_toast_write};

/// Settings page with localStorage persistence.
#[component]
pub fn SettingsPage() -> impl IntoView {
    let (settings, set_settings) = use_settings_state();
    let toast = use_toast_write();

    // Track whether this is the initial render (skip toast on mount)
    let (initialized, set_initialized) = signal(false);

    // Persist settings whenever they change
    Effect::new(move || {
        let s = settings.get();
        s.save();
        if initialized.get_untracked() {
            push_toast(toast, ToastLevel::Info, "Settings saved");
        } else {
            set_initialized.set(true);
        }
    });

    view! {
        <div class="settings-page">
            <h2>"Settings"</h2>

            <div class="settings-section">
                <h3>"Appearance"</h3>
                <div class="setting-item">
                    <label>"Theme"</label>
                    <select
                        prop:value=move || settings.get().theme
                        on:change=move |ev| {
                            let val = event_target_value(&ev);
                            set_settings.update(|s| s.theme = val);
                        }
                    >
                        <option value="dark">"Dark"</option>
                        <option value="light">"Light"</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>"Editor Font Size"</label>
                    <input
                        type="number"
                        min="10"
                        max="24"
                        prop:value=move || settings.get().font_size.to_string()
                        on:input=move |ev| {
                            if let Ok(v) = event_target_value(&ev).parse::<u32>() {
                                set_settings.update(|s| s.font_size = v.clamp(10, 24));
                            }
                        }
                    />
                </div>
            </div>

            <div class="settings-section">
                <h3>"Query"</h3>
                <div class="setting-item">
                    <label>"Default Row Limit"</label>
                    <input
                        type="number"
                        min="100"
                        max="100000"
                        prop:value=move || settings.get().row_limit.to_string()
                        on:input=move |ev| {
                            if let Ok(v) = event_target_value(&ev).parse::<u64>() {
                                set_settings.update(|s| s.row_limit = v.clamp(100, 100_000));
                            }
                        }
                    />
                </div>
                <div class="setting-item">
                    <label>"Auto-complete"</label>
                    <input
                        type="checkbox"
                        prop:checked=move || settings.get().autocomplete
                        on:change=move |_| {
                            set_settings.update(|s| s.autocomplete = !s.autocomplete);
                        }
                    />
                </div>
            </div>

            <div class="settings-section">
                <h3>"About"</h3>
                <p>"MegaFactory SQL v0.1.0"</p>
                <p>"Built with Leptos + Rust WASM"</p>
                <p>
                    <a href="https://github.com/younjin-jeong/MegaFactory-SQL" target="_blank">
                        "GitHub Repository"
                    </a>
                </p>
            </div>
        </div>
    }
}
