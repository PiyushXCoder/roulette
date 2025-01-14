#[macro_use]
extern crate rocket;

pub(crate) mod helper;
pub(crate) mod judge;
pub(crate) mod spin_timmer;
pub(crate) mod structs;
pub(crate) mod ws_messages;
pub(crate) mod ws_messages_handler;

use std::sync::Arc;

use rocket::{
    futures::{SinkExt, StreamExt},
    serde::json,
    tokio::{select, sync::mpsc},
    State,
};
use rocket_ws::{self as ws, Message};
use structs::Game;

pub(crate) type ArcGame = Arc<structs::Game>;

#[get("/game_ws")]
async fn game_ws<'a>(ws: ws::WebSocket, tables: &State<ArcGame>) -> ws::Channel<'static> {
    let game: ArcGame = tables.inner().clone();

    ws.channel(move |mut stream| {
        Box::pin(async move {
            let mut current_player_id: Option<structs::PlayerId> = None;
            let mut current_table_id: Option<structs::TableId> = None;
            let (ws_channel_sender, mut ws_channel_receiver) = mpsc::channel::<ws_messages::ResponseMessages>(10);
            loop {
                select! {
                    Some(message) = stream.next() => {
                        match message {
                            Ok(message) => {
                                match message {
                                    Message::Close(_) => { 
                                        match ws_messages_handler::handle_close(game.clone(), &current_player_id, &current_table_id).await {
                                            Ok(()) => {},
                                            Err(e) => {
                                                log::error!("{:?}", e);
                                                continue;
                                            }
                                        }
                                        break;
                                    }
                                    _ => {
                                        match ws_messages_handler::handle(message, game.clone(), ws_channel_sender.clone(), &mut current_player_id, &mut current_table_id).await {
                                            Ok(()) => {},
                                            Err(e) => {
                                                log::error!("{:?}", e);
                                                continue;
                                            }
                                        }
                                    }
                                };
                            },
                            Err(e) => {
                                log::error!("{:?}", e);
                                break;
                            }
                        }
                    },
                    Some(message) = ws_channel_receiver.recv() => {
                        let message_as_json = match json::to_string(&message) {
                            Ok(m) => m,
                            Err(e) => {
                                log::error!("{:?}", e);
                                continue;
                            }
                        };

                        match stream.send(Message::Text(message_as_json)).await {
                            Ok(())=> {},
                            Err(e) => {
                                log::error!("{:?}", e);
                                continue;
                            }
                        };
                    }
                }
            }
            Ok(())
        })
    })
}

#[launch]
fn launch() -> _ {
    let game: ArcGame = Arc::new(Game::default());
    rocket::build().manage(game).mount("/", routes![game_ws])
}
