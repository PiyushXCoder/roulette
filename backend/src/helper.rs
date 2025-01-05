use std::collections::HashMap;

use crate::{
    structs::{Player, PlayerId},
    ws_messages::ResponseMessages,
};

pub(crate) async fn broadcastResponseMessage(
    players: &HashMap<PlayerId, Player>,
    response_message: ResponseMessages,
) {
    for (_, player) in players.iter() {
        player
            .sender_channel
            .send(response_message.clone())
            .await
            .expect("Failed while broadcast");
    }
}
