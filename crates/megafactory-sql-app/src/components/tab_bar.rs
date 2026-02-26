use leptos::prelude::*;

/// A tab in the tab bar.
#[derive(Debug, Clone)]
pub struct Tab {
    pub id: String,
    pub title: String,
    pub closeable: bool,
}

/// Multi-tab bar component.
#[component]
pub fn TabBar(
    tabs: Signal<Vec<Tab>>,
    active_index: Signal<usize>,
    #[prop(into)] on_select: Callback<usize>,
    #[prop(into)] on_close: Callback<usize>,
    #[prop(into)] on_add: Callback<()>,
) -> impl IntoView {
    view! {
        <div class="tab-bar">
            <div class="tab-bar-tabs">
                {move || {
                    tabs.get().iter().enumerate().map(|(i, tab)| {
                        let is_active = i == active_index.get();
                        let tab_title = tab.title.clone();
                        let closeable = tab.closeable;
                        view! {
                            <button
                                class=move || if is_active { "tab tab--active" } else { "tab" }
                                on:click=move |_| on_select.run(i)
                            >
                                <span class="tab-title">{tab_title.clone()}</span>
                                {if closeable {
                                    Some(view! {
                                        <span
                                            class="tab-close"
                                            on:click=move |e| {
                                                e.stop_propagation();
                                                on_close.run(i);
                                            }
                                        >
                                            "x"
                                        </span>
                                    })
                                } else {
                                    None
                                }}
                            </button>
                        }
                    }).collect::<Vec<_>>()
                }}
            </div>
            <button class="tab-add" on:click=move |_| on_add.run(())>
                "+"
            </button>
        </div>
    }
}
