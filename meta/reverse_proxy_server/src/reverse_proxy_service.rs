use std::str::FromStr;

use async_trait::async_trait;
use http::uri::Uri;
use pingora::{prelude::{HttpPeer, RequestHeader}, Result};
use pingora_proxy::{ProxyHttp, Session};

pub(crate) struct ReverseProxyService;

#[async_trait]
impl ProxyHttp for ReverseProxyService {
    type CTX = ();

    fn new_ctx(&self) -> Self::CTX {}

    async fn upstream_peer(
        &self,
        _session: &mut Session,
        _: &mut Self::CTX,
    ) -> Result<Box<HttpPeer>> {
        let raw_path = _session.as_downstream().req_header().raw_path().to_vec();
        let path = String::from_utf8(raw_path).unwrap();
        let url;
        if path.starts_with("/api") {
            _session
                .req_header_mut()
                .set_uri(Uri::from_str(if path.len() > 3 { &path[4..] } else { "" }).unwrap());
            url = "127.0.0.1:8000"
        } else {
            url = "127.0.0.1:5173"
        };
        Ok(Box::new(HttpPeer::new(url, false, String::new())))
    }

    async fn upstream_request_filter(
        &self,
        _session: &mut Session,
        upstream_request: &mut RequestHeader,
        _ctx: &mut Self::CTX,
    ) -> Result<()> {
        // Forward WebSocket upgrade headers
        if let Some(upgrade) = _session.req_header().headers.get("Upgrade") {
            upstream_request
                .insert_header("Upgrade", upgrade.to_str().unwrap())
                .unwrap();
        }
        if let Some(connection) = _session.req_header().headers.get("Connection") {
            upstream_request
                .insert_header("Connection", connection.to_str().unwrap())
                .unwrap();
        }
        if let Some(ws_version) = _session.req_header().headers.get("Sec-WebSocket-Version") {
            upstream_request
                .insert_header("Sec-WebSocket-Version", ws_version.to_str().unwrap())
                .unwrap();
        }
        if let Some(ws_key) = _session.req_header().headers.get("Sec-WebSocket-Key") {
            upstream_request
                .insert_header("Sec-WebSocket-Key", ws_key.to_str().unwrap())
                .unwrap();
        }
        if let Some(ws_protocol) = _session.req_header().headers.get("Sec-WebSocket-Protocol") {
            upstream_request
                .insert_header("Sec-WebSocket-Protocol", ws_protocol.to_str().unwrap())
                .unwrap();
        }
        if let Some(ws_extensions) = _session.req_header().headers.get("Sec-WebSocket-Extensions") {
            upstream_request
                .insert_header("Sec-WebSocket-Extensions", ws_extensions.to_str().unwrap())
                .unwrap();
        }
        Ok(())
    }
}
