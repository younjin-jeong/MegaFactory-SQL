use leptos::prelude::*;
use megafactory_sql_types::toast::{ToastLevel, ToastMessage};

const DEFAULT_DISMISS_MS: u64 = 5000;

/// Global toast state holding active notifications.
#[derive(Debug, Clone, Default)]
pub struct ToastState {
    pub toasts: Vec<ToastMessage>,
}

pub fn provide_toast_state() {
    provide_context(signal(ToastState::default()));
}

pub fn use_toast_write() -> WriteSignal<ToastState> {
    expect_context::<(ReadSignal<ToastState>, WriteSignal<ToastState>)>().1
}

pub fn use_toast_read() -> ReadSignal<ToastState> {
    expect_context::<(ReadSignal<ToastState>, WriteSignal<ToastState>)>().0
}

/// Push a toast notification. On WASM, schedules auto-dismiss after timeout.
pub fn push_toast(
    set_state: WriteSignal<ToastState>,
    level: ToastLevel,
    message: impl Into<String>,
) {
    let toast = ToastMessage {
        id: uuid::Uuid::new_v4(),
        message: message.into(),
        level,
        auto_dismiss_ms: DEFAULT_DISMISS_MS,
    };
    let id = toast.id;
    set_state.update(|s| s.toasts.push(toast));

    #[cfg(target_arch = "wasm32")]
    {
        let set_state = set_state;
        gloo_timers::callback::Timeout::new(DEFAULT_DISMISS_MS as u32, move || {
            set_state.update(|s| s.toasts.retain(|t| t.id != id));
        })
        .forget();
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        let _ = id;
    }
}
