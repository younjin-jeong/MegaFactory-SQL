use leptos::prelude::*;

/// Confirmation modal dialog.
#[component]
pub fn ConfirmModal(
    title: String,
    message: String,
    show: Signal<bool>,
    #[prop(into)] on_confirm: Callback<()>,
    #[prop(into)] on_cancel: Callback<()>,
) -> impl IntoView {
    view! {
        <div
            class="modal-overlay"
            style=move || if show.get() { "display:flex" } else { "display:none" }
        >
            <div class="modal">
                <div class="modal-header">
                    <h3>{title}</h3>
                </div>
                <div class="modal-body">
                    <p>{message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" on:click=move |_| on_cancel.run(())>
                        "Cancel"
                    </button>
                    <button class="btn btn-primary" on:click=move |_| on_confirm.run(())>
                        "Confirm"
                    </button>
                </div>
            </div>
        </div>
    }
}
