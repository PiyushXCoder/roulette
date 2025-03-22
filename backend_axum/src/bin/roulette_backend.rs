#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    roulette_api::start_server("0.0.0.0:8000").await.unwrap();
}
