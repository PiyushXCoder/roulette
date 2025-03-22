mod auth;

use axum::Router;
use common::error;

pub async fn start_server(bind_address: &str) -> Result<(), error::Error> {
    let app = Router::new().nest("/api/auth", auth::workspaced_service());
    let listener = tokio::net::TcpListener::bind(bind_address).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
