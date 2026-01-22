use std::sync::Arc;

use rocket::{
    futures::{SinkExt, StreamExt},
    serde::json,
    tokio::{select, sync::mpsc},
    State,
};
use rocket_ws::{self as ws, Message};
use crate::{structs::{self}, ws_messages, ws_messages_handler};

pub(crate) type ArcGame = Arc<structs::Game>;


macro_rules! unwrap_or_log_and_continue {
    ($result: expr) => {
        match $result {
            Ok(m)=> { m },
            Err(e) => {
                log::error!("{:?}", e);
                continue;
            }
        }
    };
}

#[get("/game_ws")]
pub(crate) async fn game_ws<'a>(ws: ws::WebSocket, tables: &State<ArcGame>) -> ws::Channel<'static> {
    let game: ArcGame = tables.inner().clone();

    ws.channel(move |mut stream| {
        Box::pin(async move {
            let mut current_player_id: Option<structs::PlayerId> = None;
            let mut current_table_id: Option<structs::TableId> = None;
            let (ws_channel_sender, mut ws_channel_receiver) = mpsc::channel::<ws_messages::ResponseMessages>(10);
            log::debug!("New WebSocket connection established");
            loop {
                select! {
                    Some(message) = stream.next() => {
                        log::debug!("Received message: {:?}", message);
                        match message {
                            Ok(message) => {
                                match message {
                                    Message::Close(_) => {  
                                        unwrap_or_log_and_continue!(
                                            ws_messages_handler::handle_close(game.clone(), &current_player_id, &current_table_id).await);
                                        break;
                                    }
                                    _ => {
                                        log::debug!("Calling handler...");
                                        unwrap_or_log_and_continue!(
                                            ws_messages_handler::handle(message, game.clone(), ws_channel_sender.clone(), &mut current_player_id, &mut current_table_id).await);
                                        log::debug!("Handler returned successfully");
                                    }
                                };
                            },
                            Err(e) => {
                                log::error!("WebSocket error: {:?}", e);
                                break;
                            }
                        }
                    },
                    Some(message) = ws_channel_receiver.recv() => {
                        log::debug!("Sending message: {:?}", message);
                        let message_as_json = unwrap_or_log_and_continue!(json::to_string(&message)); 
                        unwrap_or_log_and_continue!(stream.send(Message::Text(message_as_json)).await);
                    }
                }
            }
            log::debug!("WebSocket loop exited");
            Ok(())
        })
    })
}

