#[macro_use]
extern crate rocket;

pub(crate) mod game_websocket;
pub(crate) mod helper;
pub(crate) mod judge;
pub(crate) mod spin_timmer;
pub(crate) mod structs;
pub(crate) mod ws_messages;
pub(crate) mod ws_messages_handler;

use game_websocket::{game_ws, ArcGame};
use std::sync::Arc;
use structs::Game;

#[launch]
fn launch() -> _ {
    env_logger::init();
    log::info!("Starting roulette backend server");
    let game: ArcGame = Arc::new(Game::default());
    rocket::build()
        .manage(game)
        .mount("/api", routes![game_ws, home])
}

#[get("/")]
fn home() -> &'static str {
    "Api is up!"
}
