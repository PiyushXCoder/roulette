use std::{collections::HashMap, sync::Arc};

use rocket::tokio::sync::Mutex;

use crate::{
    structs::{Player, PlayerId},
    ws_messages::ResponseMessages,
};

pub(crate) async fn broadcast_response_message(
    players: Arc<Mutex<HashMap<PlayerId, Player>>>,
    response_message: ResponseMessages,
) {
    let players_ref = players.lock().await;
    for (_, player) in players_ref.iter() {
        if player.ws_channel_sender.is_closed() {
            continue;
        }
        player
            .ws_channel_sender
            .send(response_message.clone())
            .await
            .expect("Failed while broadcast");
    }
}
