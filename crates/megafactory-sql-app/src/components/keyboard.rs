use leptos::prelude::*;

/// A keyboard shortcut definition.
#[derive(Debug, Clone)]
pub struct Shortcut {
    pub keys: &'static str,
    pub description: &'static str,
    pub category: &'static str,
}

pub const SHORTCUTS: &[Shortcut] = &[
    Shortcut {
        keys: "Ctrl+Enter",
        description: "Execute query",
        category: "Editor",
    },
    Shortcut {
        keys: "Ctrl+K",
        description: "Command palette",
        category: "General",
    },
    Shortcut {
        keys: "Ctrl+1",
        description: "SQL Editor",
        category: "Navigation",
    },
    Shortcut {
        keys: "Ctrl+2",
        description: "Schema Browser",
        category: "Navigation",
    },
    Shortcut {
        keys: "Ctrl+3",
        description: "Kubernetes",
        category: "Navigation",
    },
    Shortcut {
        keys: "Ctrl+4",
        description: "Monitoring",
        category: "Navigation",
    },
    Shortcut {
        keys: "Ctrl+5",
        description: "Connections",
        category: "Navigation",
    },
    Shortcut {
        keys: "Ctrl+6",
        description: "Settings",
        category: "Navigation",
    },
    Shortcut {
        keys: "Ctrl+N",
        description: "New query tab",
        category: "Editor",
    },
    Shortcut {
        keys: "Ctrl+W",
        description: "Close current tab",
        category: "Editor",
    },
    Shortcut {
        keys: "?",
        description: "Show shortcuts",
        category: "General",
    },
];

/// Global keyboard event handler. Renders once at app root.
#[component]
pub fn KeyboardManager() -> impl IntoView {
    let (show_help, set_show_help) = signal(false);
    let (show_palette, set_show_palette) = signal(false);

    #[cfg(target_arch = "wasm32")]
    {
        use wasm_bindgen::prelude::*;
        use wasm_bindgen::JsCast;

        let set_show_help_clone = set_show_help;
        let set_show_palette_clone = set_show_palette;

        Effect::new(move || {
            let document = match web_sys::window().and_then(|w| w.document()) {
                Some(d) => d,
                None => return,
            };

            let closure = Closure::<dyn Fn(web_sys::KeyboardEvent)>::new(
                move |ev: web_sys::KeyboardEvent| {
                    let ctrl = ev.ctrl_key() || ev.meta_key();
                    let key = ev.key();

                    match (ctrl, key.as_str()) {
                        (true, "k") | (true, "K") => {
                            ev.prevent_default();
                            set_show_palette_clone.update(|v| *v = !*v);
                        }
                        (true, "1") => {
                            ev.prevent_default();
                            navigate_to("/sql");
                        }
                        (true, "2") => {
                            ev.prevent_default();
                            navigate_to("/schema");
                        }
                        (true, "3") => {
                            ev.prevent_default();
                            navigate_to("/k8s");
                        }
                        (true, "4") => {
                            ev.prevent_default();
                            navigate_to("/monitoring");
                        }
                        (true, "5") => {
                            ev.prevent_default();
                            navigate_to("/connections");
                        }
                        (true, "6") => {
                            ev.prevent_default();
                            navigate_to("/settings");
                        }
                        (false, "?") => {
                            if !is_input_focused() {
                                set_show_help_clone.update(|v| *v = !*v);
                            }
                        }
                        (false, "Escape") => {
                            set_show_help_clone.set(false);
                            set_show_palette_clone.set(false);
                        }
                        _ => {}
                    }
                },
            );
            let _ = document
                .add_event_listener_with_callback("keydown", closure.as_ref().unchecked_ref());
            closure.forget();
        });
    }

    view! {
        {move || {
            if show_help.get() {
                Some(view! {
                    <ShortcutsHelp on_close=Callback::new(move |_| set_show_help.set(false)) />
                })
            } else {
                None
            }
        }}
        {move || {
            if show_palette.get() {
                Some(view! {
                    <CommandPalette on_close=Callback::new(move |_| set_show_palette.set(false)) />
                })
            } else {
                None
            }
        }}
    }
}

#[component]
fn ShortcutsHelp(#[prop(into)] on_close: Callback<()>) -> impl IntoView {
    let categories = ["General", "Navigation", "Editor"];

    view! {
        <div class="modal-overlay" on:click=move |_| on_close.run(())>
            <div class="modal shortcuts-help" on:click=move |ev| ev.stop_propagation()>
                <div class="modal-header">
                    <h3>"Keyboard Shortcuts"</h3>
                    <button class="toast-dismiss" on:click=move |_| on_close.run(())>"x"</button>
                </div>
                <div class="modal-body">
                    {categories.iter().map(|cat| {
                        let shortcuts: Vec<_> = SHORTCUTS.iter().filter(|s| s.category == *cat).collect();
                        view! {
                            <div class="shortcuts-category">
                                <h4>{*cat}</h4>
                                {shortcuts.iter().map(|s| {
                                    view! {
                                        <div class="shortcut-row">
                                            <span class="shortcut-desc">{s.description}</span>
                                            <span class="shortcut-keys">{s.keys}</span>
                                        </div>
                                    }
                                }).collect::<Vec<_>>()}
                            </div>
                        }
                    }).collect::<Vec<_>>()}
                </div>
            </div>
        </div>
    }
}

#[component]
fn CommandPalette(#[prop(into)] on_close: Callback<()>) -> impl IntoView {
    let (filter, set_filter) = signal(String::new());

    let commands: Vec<(&str, &str)> = vec![
        ("SQL Editor", "/sql"),
        ("Schema Browser", "/schema"),
        ("Kubernetes Dashboard", "/k8s"),
        ("Performance Monitoring", "/monitoring"),
        ("Connections", "/connections"),
        ("Settings", "/settings"),
    ];

    view! {
        <div class="command-palette-overlay" on:click=move |_| on_close.run(())>
            <div class="command-palette" on:click=move |ev| ev.stop_propagation()>
                <input
                    class="command-palette-input"
                    type="text"
                    placeholder="Type a command..."
                    prop:value=move || filter.get()
                    on:input=move |ev| set_filter.set(event_target_value(&ev))
                    on:keydown=move |ev| {
                        if ev.key() == "Escape" {
                            on_close.run(());
                        }
                    }
                    autofocus=true
                />
                <div class="command-palette-results">
                    {move || {
                        let f = filter.get().to_lowercase();
                        commands.iter()
                            .filter(|(name, _)| f.is_empty() || name.to_lowercase().contains(&f))
                            .map(|(name, href)| {
                                let href = *href;
                                view! {
                                    <div
                                        class="command-palette-item"
                                        on:click=move |_| {
                                            navigate_to(href);
                                            on_close.run(());
                                        }
                                    >
                                        <span>{*name}</span>
                                    </div>
                                }
                            })
                            .collect::<Vec<_>>()
                    }}
                </div>
            </div>
        </div>
    }
}

#[cfg(target_arch = "wasm32")]
fn navigate_to(path: &str) {
    if let Some(window) = web_sys::window() {
        let _ = window.location().set_href(path);
    }
}

#[cfg(not(target_arch = "wasm32"))]
fn navigate_to(_path: &str) {}

#[cfg(target_arch = "wasm32")]
fn is_input_focused() -> bool {
    web_sys::window()
        .and_then(|w| w.document())
        .and_then(|d| d.active_element())
        .map(|el| {
            let tag = el.tag_name().to_uppercase();
            tag == "INPUT" || tag == "TEXTAREA" || tag == "SELECT"
        })
        .unwrap_or(false)
}

#[cfg(not(target_arch = "wasm32"))]
#[allow(dead_code)]
fn is_input_focused() -> bool {
    false
}
