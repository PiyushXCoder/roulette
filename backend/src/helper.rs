use std::{collections::HashMap, sync::Arc};

use anyhow::Ok;
use rocket::tokio::sync::Mutex;

use crate::{
    structs::{Player, PlayerId},
    ws_messages::ResponseMessages,
};

pub(crate) async fn broadcast_response_message(
    players: Arc<Mutex<HashMap<PlayerId, Player>>>,
    except: Option<Vec<PlayerId>>,
    response_message: ResponseMessages,
) -> anyhow::Result<()> {
    let players_ref = players.lock().await;
    let except = except.unwrap_or(Vec::new());
    for (player_id, player) in players_ref.iter() {
        if player.ws_channel_sender.is_closed() || except.contains(player_id) {
            continue;
        }
        player
            .ws_channel_sender
            .send(response_message.clone())
            .await?;
    }
    Ok(())
}
