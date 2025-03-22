use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("`{0}`")]
    Io(#[from] std::io::Error),
}
