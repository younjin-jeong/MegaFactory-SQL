use leptos::prelude::*;

/// Panel for controlling cluster scaling.
#[component]
pub fn ScalingPanel(
    current_replicas: Signal<i32>,
    min_replicas: Signal<i32>,
    max_replicas: Signal<i32>,
    #[prop(into)] on_scale: Callback<i32>,
) -> impl IntoView {
    let (desired, set_desired) = signal(0i32);

    // Sync desired with current when current changes
    Effect::new(move || {
        set_desired.set(current_replicas.get());
    });

    view! {
        <div class="scaling-panel">
            <h3>"Scale Workers"</h3>
            <div class="scaling-controls">
                <label>
                    "Replicas: "
                    <input
                        type="range"
                        prop:min=move || min_replicas.get().to_string()
                        prop:max=move || max_replicas.get().to_string()
                        prop:value=move || desired.get().to_string()
                        on:input=move |ev| {
                            if let Ok(v) = event_target_value(&ev).parse::<i32>() {
                                set_desired.set(v);
                            }
                        }
                    />
                    <span class="scaling-value">{move || desired.get()}</span>
                </label>
                <button
                    class="btn btn-primary"
                    disabled=move || desired.get() == current_replicas.get()
                    on:click=move |_| on_scale.run(desired.get())
                >
                    "Apply"
                </button>
            </div>
            <div class="scaling-info">
                <span>"Current: " {move || current_replicas.get()}</span>
                <span>" | Min: " {move || min_replicas.get()}</span>
                <span>" | Max: " {move || max_replicas.get()}</span>
            </div>
        </div>
    }
}
