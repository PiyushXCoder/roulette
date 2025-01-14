use std::str::FromStr;

use async_trait::async_trait;
use http::uri::Uri;
use pingora::{prelude::HttpPeer, Result};
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
}
