mod reverse_proxy_service;

use pingora::server::Server;
use pingora_proxy::http_proxy_service;

fn main() {
    let mut server = Server::new(None).unwrap();
    server.bootstrap();

    let mut frontend_service = http_proxy_service(
        &server.configuration,
        reverse_proxy_service::ReverseProxyService,
    );
    frontend_service.add_tcp("0.0.0.0:8001");
    server.add_service(frontend_service);
    server.run_forever();
}
