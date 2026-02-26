use leptos::prelude::*;
use megafactory_sql_types::toast::ToastLevel;

use crate::state::toast::use_toast_read;

/// Toast notification container. Reads from global ToastState context.
#[component]
pub fn ToastContainer() -> impl IntoView {
    let toast_state = use_toast_read();

    view! {
        <div class="toast-container">
            {move || {
                toast_state.get().toasts.iter().map(|toast| {
                    let class = match toast.level {
                        ToastLevel::Info => "toast toast--info",
                        ToastLevel::Success => "toast toast--success",
                        ToastLevel::Warning => "toast toast--warning",
                        ToastLevel::Error => "toast toast--error",
                    };
                    let id = toast.id;
                    let set_toast = crate::state::toast::use_toast_write();
                    view! {
                        <div class=class>
                            <span class="toast-message">{toast.message.clone()}</span>
                            <button
                                class="toast-dismiss"
                                on:click=move |_| {
                                    set_toast.update(|s| s.toasts.retain(|t| t.id != id));
                                }
                            >
                                "x"
                            </button>
                        </div>
                    }
                }).collect::<Vec<_>>()
            }}
        </div>
    }
}
