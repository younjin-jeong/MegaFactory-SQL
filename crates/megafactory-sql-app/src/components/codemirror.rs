use leptos::prelude::*;

/// CodeMirror 6 SQL editor wrapper.
///
/// On the client (WASM), initializes a CodeMirror 6 editor instance via
/// `window.__cm.createEditor()` (loaded from `js/codemirror-bridge.js`).
/// Falls back to a plain `<textarea>` on SSR or if CM6 fails to load.
#[component]
pub fn CodeMirrorEditor(
    #[prop(default = String::new())] initial_content: String,
    #[prop(into)] on_execute: Callback<String>,
    #[prop(into, optional)] on_change: Option<Callback<String>>,
) -> impl IntoView {
    let (content, set_content) = signal(initial_content.clone());
    let editor_id = format!("cm-{}", uuid::Uuid::new_v4().as_simple());
    let editor_id_for_view = editor_id.clone();

    // On WASM: mount CodeMirror after hydration
    #[cfg(target_arch = "wasm32")]
    {
        let editor_id_effect = editor_id.clone();
        let initial = initial_content.clone();

        Effect::new(move || {
            use wasm_bindgen::prelude::*;

            let window = match web_sys::window() {
                Some(w) => w,
                None => return,
            };

            // Access window.__cm
            let cm = match js_sys::Reflect::get(&window, &"__cm".into()) {
                Ok(v) if !v.is_undefined() => v,
                _ => return, // CM6 not loaded yet
            };

            let create_fn = match js_sys::Reflect::get(&cm, &"createEditor".into()) {
                Ok(f) => js_sys::Function::from(f),
                Err(_) => return,
            };

            // Create JS closures for callbacks
            let on_execute_clone = on_execute;
            let execute_closure = Closure::<dyn Fn(String)>::new(move |sql: String| {
                on_execute_clone.run(sql);
            });

            let on_change_clone = on_change;
            let set_content_clone = set_content;
            let change_closure = Closure::<dyn Fn(String)>::new(move |sql: String| {
                set_content_clone.set(sql.clone());
                if let Some(cb) = &on_change_clone {
                    cb.run(sql);
                }
            });

            let _ = create_fn.call4(
                &JsValue::NULL,
                &JsValue::from_str(&editor_id_effect),
                &JsValue::from_str(&initial),
                execute_closure.as_ref(),
                change_closure.as_ref(),
            );

            // Prevent closures from being dropped (they need to live as long as the editor)
            execute_closure.forget();
            change_closure.forget();
        });
    }

    view! {
        <div class="codemirror-wrapper" id=editor_id_for_view>
            <textarea
                class="codemirror-fallback"
                prop:value=move || content.get()
                on:input=move |ev| {
                    let val = event_target_value(&ev);
                    set_content.set(val.clone());
                    if let Some(cb) = &on_change {
                        cb.run(val);
                    }
                }
                on:keydown=move |ev| {
                    if (ev.ctrl_key() || ev.meta_key()) && ev.key() == "Enter" {
                        ev.prevent_default();
                        on_execute.run(content.get());
                    }
                }
                placeholder="-- Write your SQL here...\n-- Press Ctrl+Enter to execute"
                rows=12
                spellcheck="false"
            ></textarea>
        </div>
    }
}
