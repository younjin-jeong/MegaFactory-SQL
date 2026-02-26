use leptos::prelude::*;

/// Available refresh intervals.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum RefreshInterval {
    Off,
    Seconds5,
    Seconds10,
    Seconds30,
    Seconds60,
}

impl RefreshInterval {
    pub fn as_millis(&self) -> Option<u32> {
        match self {
            Self::Off => None,
            Self::Seconds5 => Some(5_000),
            Self::Seconds10 => Some(10_000),
            Self::Seconds30 => Some(30_000),
            Self::Seconds60 => Some(60_000),
        }
    }

    pub fn label(&self) -> &'static str {
        match self {
            Self::Off => "Off",
            Self::Seconds5 => "5s",
            Self::Seconds10 => "10s",
            Self::Seconds30 => "30s",
            Self::Seconds60 => "60s",
        }
    }

    pub fn all() -> &'static [RefreshInterval] {
        &[
            Self::Off,
            Self::Seconds5,
            Self::Seconds10,
            Self::Seconds30,
            Self::Seconds60,
        ]
    }

    fn from_label(label: &str) -> Self {
        match label {
            "5s" => Self::Seconds5,
            "10s" => Self::Seconds10,
            "30s" => Self::Seconds30,
            "60s" => Self::Seconds60,
            _ => Self::Off,
        }
    }
}

/// Auto-refresh selector control with a dropdown and "Refresh now" button.
/// Manages its own interval state internally.
#[component]
pub fn AutoRefreshControl(
    #[prop(default = RefreshInterval::Off)] initial_interval: RefreshInterval,
    #[prop(into)] on_refresh: Callback<()>,
) -> impl IntoView {
    let (interval, set_interval) = signal(initial_interval);

    // Set up periodic refresh on WASM
    #[cfg(target_arch = "wasm32")]
    {
        let on_refresh_clone = on_refresh;
        Effect::new(move || {
            let iv = interval.get();
            if let Some(ms) = iv.as_millis() {
                let on_refresh_inner = on_refresh_clone;
                let handle = gloo_timers::callback::Interval::new(ms, move || {
                    on_refresh_inner.run(());
                });
                handle.forget();
            }
        });
    }

    view! {
        <div class="auto-refresh-control">
            {move || {
                let class = if interval.get() != RefreshInterval::Off {
                    "auto-refresh-indicator auto-refresh-indicator--active"
                } else {
                    "auto-refresh-indicator auto-refresh-indicator--inactive"
                };
                view! { <span class=class></span> }
            }}
            <select
                on:change=move |ev| {
                    let val = event_target_value(&ev);
                    set_interval.set(RefreshInterval::from_label(&val));
                }
            >
                {RefreshInterval::all().iter().map(|iv| {
                    let label = iv.label();
                    view! {
                        <option value=label>{label}</option>
                    }
                }).collect::<Vec<_>>()}
            </select>
            <button class="btn btn-sm" on:click=move |_| on_refresh.run(())>
                "Refresh"
            </button>
        </div>
    }
}
