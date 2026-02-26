use leptos::prelude::*;

/// WebSocket connection status.
#[derive(Debug, Clone, PartialEq, Default)]
pub enum WsConnectionStatus {
    #[default]
    Disconnected,
    Connecting,
    Connected,
    Reconnecting {
        attempt: u32,
    },
}

/// Provide WebSocket manager context. On WASM, connects to the server's /ws endpoint.
pub fn provide_websocket() {
    let status = signal(WsConnectionStatus::default());
    provide_context(status);

    #[cfg(target_arch = "wasm32")]
    {
        use wasm_bindgen::prelude::*;
        use wasm_bindgen::JsCast;

        let (_, set_status) = status;

        Effect::new(move || {
            let window = match web_sys::window() {
                Some(w) => w,
                None => return,
            };
            let location = window.location();
            let protocol = location.protocol().unwrap_or_else(|_| "http:".into());
            let host = location.host().unwrap_or_else(|_| "localhost:3000".into());
            let ws_protocol = if protocol == "https:" { "wss:" } else { "ws:" };
            let url = format!("{ws_protocol}//{host}/ws");

            set_status.set(WsConnectionStatus::Connecting);

            let ws = match web_sys::WebSocket::new(&url) {
                Ok(ws) => ws,
                Err(_) => {
                    set_status.set(WsConnectionStatus::Disconnected);
                    return;
                }
            };

            // On open
            let set_status_open = set_status;
            let on_open = Closure::<dyn Fn()>::new(move || {
                set_status_open.set(WsConnectionStatus::Connected);
            });
            ws.set_onopen(Some(on_open.as_ref().unchecked_ref()));
            on_open.forget();

            // On close — schedule reconnect
            let set_status_close = set_status;
            let on_close = Closure::<dyn Fn()>::new(move || {
                set_status_close.set(WsConnectionStatus::Disconnected);
            });
            ws.set_onclose(Some(on_close.as_ref().unchecked_ref()));
            on_close.forget();

            // On error
            let on_error = Closure::<dyn Fn()>::new(move || {
                // Errors are followed by close events
            });
            ws.set_onerror(Some(on_error.as_ref().unchecked_ref()));
            on_error.forget();

            // On message — parse and dispatch
            let on_message =
                Closure::<dyn Fn(web_sys::MessageEvent)>::new(move |ev: web_sys::MessageEvent| {
                    if let Some(text) = ev.data().as_string() {
                        // Parse WsServerMessage and dispatch to state
                        if let Ok(_msg) = serde_json::from_str::<
                            megafactory_sql_types::ws::WsServerMessage,
                        >(&text)
                        {
                            // Future: dispatch metrics/k8s/query updates to state
                        }
                    }
                });
            ws.set_onmessage(Some(on_message.as_ref().unchecked_ref()));
            on_message.forget();

            // Send subscribe message
            let subscribe =
                serde_json::to_string(&megafactory_sql_types::ws::WsClientMessage::Subscribe {
                    topics: vec!["metrics".into(), "k8s".into()],
                })
                .unwrap_or_default();
            let _ = ws.send_with_str(&subscribe);
        });
    }
}

pub fn use_ws_status() -> ReadSignal<WsConnectionStatus> {
    expect_context::<(
        ReadSignal<WsConnectionStatus>,
        WriteSignal<WsConnectionStatus>,
    )>()
    .0
}
