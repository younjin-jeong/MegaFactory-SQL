use leptos::prelude::*;
use megafactory_sql_types::connection::ConnectionConfig;
use megafactory_sql_types::toast::ToastLevel;

use crate::state::connection::use_connection_state;
use crate::state::toast::{push_toast, use_toast_write};

/// Connection Manager page with full CRUD.
#[component]
pub fn ConnectionsPage() -> impl IntoView {
    let (conn_state, set_conn_state) = use_connection_state();
    let toast = use_toast_write();

    // Form visibility and data
    let (show_form, set_show_form) = signal(false);
    let (form_id, set_form_id) = signal(Option::<uuid::Uuid>::None); // None = add, Some = edit
    let (form_name, set_form_name) = signal(String::new());
    let (form_host, set_form_host) = signal(String::new());
    let (form_http_port, set_form_http_port) = signal("8080".to_string());
    let (form_pg_port, set_form_pg_port) = signal("5432".to_string());
    let (form_database, set_form_database) = signal(String::new());
    let (form_username, set_form_username) = signal(String::new());
    let (form_namespace, set_form_namespace) = signal(String::new());
    let (form_error, set_form_error) = signal(Option::<String>::None);

    // Confirm delete
    let (confirm_delete, set_confirm_delete) = signal(Option::<uuid::Uuid>::None);

    let open_add_form = move |_| {
        set_form_id.set(None);
        set_form_name.set("New Connection".to_string());
        set_form_host.set("localhost".to_string());
        set_form_http_port.set("8080".to_string());
        set_form_pg_port.set("5432".to_string());
        set_form_database.set("megadb".to_string());
        set_form_username.set(String::new());
        set_form_namespace.set("default".to_string());
        set_form_error.set(None);
        set_show_form.set(true);
    };

    let open_edit_form = move |conn: ConnectionConfig| {
        set_form_id.set(Some(conn.id));
        set_form_name.set(conn.name);
        set_form_host.set(conn.host);
        set_form_http_port.set(conn.http_port.to_string());
        set_form_pg_port.set(conn.pg_port.to_string());
        set_form_database.set(conn.database);
        set_form_username.set(conn.username.unwrap_or_default());
        set_form_namespace.set(conn.k8s_namespace.unwrap_or_default());
        set_form_error.set(None);
        set_show_form.set(true);
    };

    let save_form = move |_| {
        let name = form_name.get();
        let host = form_host.get();
        if name.trim().is_empty() || host.trim().is_empty() {
            set_form_error.set(Some("Name and Host are required.".to_string()));
            return;
        }
        let http_port = form_http_port.get().parse::<u16>().unwrap_or(8080);
        let pg_port = form_pg_port.get().parse::<u16>().unwrap_or(5432);
        let username_val = form_username.get();
        let namespace_val = form_namespace.get();

        let config = ConnectionConfig {
            id: form_id.get().unwrap_or_else(uuid::Uuid::new_v4),
            name,
            host,
            http_port,
            pg_port,
            database: form_database.get(),
            username: if username_val.is_empty() {
                None
            } else {
                Some(username_val)
            },
            k8s_namespace: if namespace_val.is_empty() {
                None
            } else {
                Some(namespace_val)
            },
            created_at: chrono::Utc::now(),
        };

        if form_id.get().is_some() {
            set_conn_state.update(|s| s.update_connection(config));
            push_toast(toast, ToastLevel::Success, "Connection updated");
        } else {
            set_conn_state.update(|s| s.add_connection(config));
            push_toast(toast, ToastLevel::Success, "Connection added");
        }
        set_show_form.set(false);
    };

    view! {
        <div class="connections-page">
            <div class="connections-header">
                <h2>"Connections"</h2>
                <button class="btn btn-primary" on:click=open_add_form>
                    "+ Add Connection"
                </button>
            </div>

            // Connection cards
            <div class="connections-list">
                {move || {
                    let state = conn_state.get();
                    let active_id = state.active.as_ref().map(|a| a.id);
                    state.saved_connections.iter().map(|conn| {
                        let conn_clone = conn.clone();
                        let conn_edit = conn.clone();
                        let id = conn.id;
                        let name = conn.name.clone();
                        let host = conn.host.clone();
                        let port = conn.http_port;
                        let db = conn.database.clone();
                        let is_active = active_id == Some(id);
                        let card_class = if is_active {
                            "connection-card connection-card--active"
                        } else {
                            "connection-card"
                        };

                        view! {
                            <div class=card_class>
                                <div class="connection-info">
                                    <div class="connection-name-row">
                                        {if is_active {
                                            view! { <span class="connection-status-dot connected"></span> }.into_any()
                                        } else {
                                            view! { <span class="connection-status-dot"></span> }.into_any()
                                        }}
                                        <span class="connection-name">{name}</span>
                                    </div>
                                    <span class="connection-host">{format!("{host}:{port}/{db}")}</span>
                                </div>
                                <div class="connection-actions">
                                    <button
                                        class="btn btn-sm btn-primary"
                                        disabled=is_active
                                        on:click=move |_| {
                                            let _ = &conn_clone;
                                            set_conn_state.update(|s| s.set_active(id));
                                        }
                                    >
                                        {if is_active { "Active" } else { "Connect" }}
                                    </button>
                                    <button
                                        class="btn btn-sm"
                                        on:click=move |_| open_edit_form(conn_edit.clone())
                                    >
                                        "Edit"
                                    </button>
                                    <button
                                        class="btn btn-sm btn-danger"
                                        on:click=move |_| set_confirm_delete.set(Some(id))
                                    >
                                        "Del"
                                    </button>
                                </div>
                            </div>
                        }
                    }).collect::<Vec<_>>()
                }}
            </div>

            // Delete confirmation
            {move || {
                confirm_delete.get().map(|id| {
                    view! {
                        <div class="modal-overlay">
                            <div class="modal">
                                <h3>"Delete Connection?"</h3>
                                <p>"This action cannot be undone."</p>
                                <div class="modal-actions">
                                    <button
                                        class="btn btn-danger"
                                        on:click=move |_| {
                                            set_conn_state.update(|s| s.remove_connection(id));
                                            set_confirm_delete.set(None);
                                            push_toast(toast, ToastLevel::Warning, "Connection deleted");
                                        }
                                    >
                                        "Delete"
                                    </button>
                                    <button
                                        class="btn btn-secondary"
                                        on:click=move |_| set_confirm_delete.set(None)
                                    >
                                        "Cancel"
                                    </button>
                                </div>
                            </div>
                        </div>
                    }
                })
            }}

            // Add/Edit form modal
            {move || {
                if !show_form.get() {
                    return None;
                }
                Some(view! {
                    <div class="modal-overlay">
                        <div class="modal connection-form-modal">
                            <h3>
                                {if form_id.get().is_some() { "Edit Connection" } else { "New Connection" }}
                            </h3>

                            {move || form_error.get().map(|e| view! {
                                <div class="form-error">{e}</div>
                            })}

                            <div class="connection-form">
                                <div class="form-field">
                                    <label>"Name"</label>
                                    <input
                                        type="text"
                                        prop:value=move || form_name.get()
                                        on:input=move |ev| set_form_name.set(event_target_value(&ev))
                                        placeholder="My MegaDB"
                                    />
                                </div>
                                <div class="form-field">
                                    <label>"Host"</label>
                                    <input
                                        type="text"
                                        prop:value=move || form_host.get()
                                        on:input=move |ev| set_form_host.set(event_target_value(&ev))
                                        placeholder="localhost"
                                    />
                                </div>
                                <div class="form-row">
                                    <div class="form-field">
                                        <label>"HTTP Port"</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="65535"
                                            prop:value=move || form_http_port.get()
                                            on:input=move |ev| set_form_http_port.set(event_target_value(&ev))
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label>"PG Port"</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="65535"
                                            prop:value=move || form_pg_port.get()
                                            on:input=move |ev| set_form_pg_port.set(event_target_value(&ev))
                                        />
                                    </div>
                                </div>
                                <div class="form-field">
                                    <label>"Database"</label>
                                    <input
                                        type="text"
                                        prop:value=move || form_database.get()
                                        on:input=move |ev| set_form_database.set(event_target_value(&ev))
                                        placeholder="megadb"
                                    />
                                </div>
                                <div class="form-field">
                                    <label>"Username (optional)"</label>
                                    <input
                                        type="text"
                                        prop:value=move || form_username.get()
                                        on:input=move |ev| set_form_username.set(event_target_value(&ev))
                                    />
                                </div>
                                <div class="form-field">
                                    <label>"K8s Namespace (optional)"</label>
                                    <input
                                        type="text"
                                        prop:value=move || form_namespace.get()
                                        on:input=move |ev| set_form_namespace.set(event_target_value(&ev))
                                        placeholder="default"
                                    />
                                </div>
                            </div>

                            <div class="modal-actions">
                                <button class="btn btn-primary" on:click=save_form>
                                    "Save"
                                </button>
                                <button
                                    class="btn btn-secondary"
                                    on:click=move |_| set_show_form.set(false)
                                >
                                    "Cancel"
                                </button>
                            </div>
                        </div>
                    </div>
                })
            }}
        </div>
    }
}
