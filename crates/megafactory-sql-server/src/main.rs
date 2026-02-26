use axum::{extract::Extension, routing::get, Router};
use leptos::config::LeptosOptions;
use leptos::prelude::*;
use leptos_axum::{generate_route_list, LeptosRoutes};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;
use tracing_subscriber::EnvFilter;

mod config;
mod proxy;
mod websocket;

// CodeMirror 6 importmap for CDN-based loading (no npm required).
const IMPORTMAP: &str = r#"<script type="importmap">
{
  "imports": {
    "codemirror": "https://esm.sh/codemirror@6.0.1",
    "@codemirror/state": "https://esm.sh/@codemirror/state@6.4.1",
    "@codemirror/view": "https://esm.sh/@codemirror/view@6.26.3",
    "@codemirror/lang-sql": "https://esm.sh/@codemirror/lang-sql@6.6.4",
    "@codemirror/theme-one-dark": "https://esm.sh/@codemirror/theme-one-dark@6.1.2"
  }
}
</script>
<script type="module" src="/js/codemirror-bridge.js"></script>"#;

fn shell(options: LeptosOptions) -> impl IntoView {
    view! {
        <!DOCTYPE html>
        <html lang="en" class="dark">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <div inner_html=IMPORTMAP style="display:none" />
                <AutoReload options=options.clone() />
                <HydrationScripts options=options />
                <link rel="stylesheet" href="/style/main.css" />
            </head>
            <body>
                <megafactory_sql_app::App />
            </body>
        </html>
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let app_config = config::AppConfig::from_env();
    tracing::info!("Starting MegaFactory SQL on {}", app_config.bind_address);
    tracing::info!("MegaDB backend: {}", app_config.megadb_url);

    let leptos_options = LeptosOptions::builder()
        .output_name("megafactory-sql")
        .site_root("site")
        .site_pkg_dir("pkg")
        .site_addr(
            app_config
                .bind_address
                .parse::<std::net::SocketAddr>()
                .unwrap_or_else(|_| std::net::SocketAddr::from(([0, 0, 0, 0], 3000))),
        )
        .build();

    let routes = generate_route_list(megafactory_sql_app::App);

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Create WebSocket hub for real-time broadcast
    let ws_hub = websocket::WsHub::new();

    // Build proxy + WS routes as a standalone Router (no state needed).
    let api_routes: Router<()> = proxy::router()
        .route("/ws", get(websocket::ws_upgrade_handler))
        .layer(Extension(Arc::clone(&ws_hub)))
        .layer(Extension(app_config.clone()));

    // Build the Leptos app router with static file serving.
    let app: Router<LeptosOptions> = Router::default();
    let app = app
        .nest_service("/js", ServeDir::new("js"))
        .leptos_routes(&leptos_options, routes, {
            let options = leptos_options.clone();
            move || shell(options.clone())
        })
        .fallback(leptos_axum::file_and_error_handler(shell))
        .layer(cors)
        .with_state(leptos_options)
        .merge(api_routes);

    let listener = tokio::net::TcpListener::bind(&app_config.bind_address)
        .await
        .expect("Failed to bind");
    tracing::info!("Listening on http://{}", app_config.bind_address);

    axum::serve(listener, app.into_make_service())
        .await
        .expect("Server error");
}
