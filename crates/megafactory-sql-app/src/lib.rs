pub mod components;
pub mod pages;
pub mod state;
pub mod storage;

use leptos::prelude::*;
use leptos_meta::*;
use leptos_router::{
    components::{Route, Router, Routes},
    path,
};

use pages::{
    connections::ConnectionsPage, k8s_dashboard::K8sDashboardPage, monitoring::MonitoringPage,
    schema_browser::SchemaBrowserPage, settings::SettingsPage, sql_editor::SqlEditorPage,
    workbench::WorkbenchPage,
};

use components::sidebar::Sidebar;

/// Root application shell with router.
#[component]
pub fn App() -> impl IntoView {
    provide_meta_context();

    // Provide global state contexts
    state::query::provide_query_state();
    state::schema::provide_schema_state();
    state::k8s::provide_k8s_state();
    state::connection::provide_connection_state();
    state::settings::provide_settings_state();
    state::toast::provide_toast_state();

    view! {
        <Stylesheet id="app-styles" href="/style/main.css" />
        <Title text="MegaFactory SQL" />
        <Meta name="description" content="MegaFactory SQL — SQL Editor, K8s Dashboard, Performance Monitoring" />

        <Router>
            <div class="app-layout">
                <Sidebar />
                <main class="app-main">
                    <Routes fallback=|| view! { <NotFound /> }>
                        <Route path=path!("/") view=SqlEditorPage />
                        <Route path=path!("/sql") view=SqlEditorPage />
                        <Route path=path!("/schema") view=SchemaBrowserPage />
                        <Route path=path!("/k8s") view=K8sDashboardPage />
                        <Route path=path!("/monitoring") view=MonitoringPage />
                        <Route path=path!("/workbench") view=WorkbenchPage />
                        <Route path=path!("/connections") view=ConnectionsPage />
                        <Route path=path!("/settings") view=SettingsPage />
                    </Routes>
                </main>
                <components::toast::ToastContainer />
                <components::keyboard::KeyboardManager />
            </div>
        </Router>
    }
}

#[component]
fn NotFound() -> impl IntoView {
    view! {
        <div class="not-found">
            <h1>"404"</h1>
            <p>"Page not found"</p>
            <a href="/">"Go to SQL Editor"</a>
        </div>
    }
}
