use leptos::prelude::*;

use crate::storage;

/// Main navigation sidebar with collapse/expand support.
#[component]
pub fn Sidebar() -> impl IntoView {
    let initial: bool = storage::get(storage::keys::SIDEBAR_COLLAPSED).unwrap_or(false);
    let (collapsed, set_collapsed) = signal(initial);

    // Persist collapse state
    Effect::new(move || {
        let val = collapsed.get();
        storage::set(storage::keys::SIDEBAR_COLLAPSED, &val);
    });

    let sidebar_class = move || {
        if collapsed.get() {
            "sidebar sidebar--collapsed"
        } else {
            "sidebar"
        }
    };

    view! {
        <nav class=sidebar_class>
            <div class="sidebar-header">
                <h1 class="sidebar-logo">
                    {move || if collapsed.get() { "M" } else { "MegaDB" }}
                </h1>
                {move || if !collapsed.get() {
                    Some(view! { <span class="sidebar-version">"v0.1"</span> })
                } else {
                    None
                }}
                <button
                    class="sidebar-toggle"
                    title=move || if collapsed.get() { "Expand sidebar" } else { "Collapse sidebar" }
                    on:click=move |_| set_collapsed.update(|v| *v = !*v)
                >
                    {move || if collapsed.get() { ">" } else { "<" }}
                </button>
            </div>

            <div class="sidebar-nav">
                <SidebarLink href="/sql" icon="terminal" label="SQL Editor" collapsed=collapsed />
                <SidebarLink href="/schema" icon="database" label="Schema" collapsed=collapsed />
                <SidebarLink href="/k8s" icon="server" label="Kubernetes" collapsed=collapsed />
                <SidebarLink href="/monitoring" icon="activity" label="Monitoring" collapsed=collapsed />
            </div>

            <div class="sidebar-footer">
                <SidebarLink href="/connections" icon="plug" label="Connections" collapsed=collapsed />
                <SidebarLink href="/settings" icon="settings" label="Settings" collapsed=collapsed />
            </div>
        </nav>
    }
}

#[component]
fn SidebarLink(
    href: &'static str,
    icon: &'static str,
    label: &'static str,
    collapsed: ReadSignal<bool>,
) -> impl IntoView {
    view! {
        <a href=href class="sidebar-link" title=label>
            <span class="sidebar-link-icon">{icon_svg(icon)}</span>
            {move || if !collapsed.get() {
                Some(view! { <span class="sidebar-link-label">{label}</span> })
            } else {
                None
            }}
        </a>
    }
}

/// Simple text icons for sidebar navigation.
fn icon_svg(name: &str) -> &'static str {
    match name {
        "terminal" => ">_",
        "database" => "DB",
        "server" => "K8",
        "activity" => "PM",
        "plug" => "CN",
        "settings" => "ST",
        _ => "??",
    }
}
