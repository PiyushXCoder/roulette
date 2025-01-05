use std::{collections::HashMap, sync::Arc};

use rocket::{
    serde::json,
    tokio::sync::{mpsc::Sender, Mutex},
};
use rocket_ws::Message;
use uuid::Uuid;

use crate::{
    spin_timmer,
    structs::Placement,
    ws_messages::{self, RequestMessages, ResponseMessages},
    ArcGame,
};

use crate::structs::{Bet, Player, PlayerId, Table, TableId, Timmer};

pub(crate) async fn handle(
    message: Message,
    game: ArcGame,
    ws_channel_sender: Sender<ResponseMessages>,
    current_player_id: &mut Option<PlayerId>,
    current_table_id: &mut Option<TableId>,
) {
    let request_message: RequestMessages = match message {
        Message::Text(text) => match json::from_str(&text) {
            Ok(req) => req,
            Err(_) => return,
        },
        _ => return,
    };

    match request_message {
        RequestMessages::JoinTable {
            table_id,
            player_id,
        } => {
            join_table(
                game,
                ws_channel_sender,
                current_player_id,
                current_table_id,
                table_id,
                player_id,
            )
            .await;
        }
        RequestMessages::GetStatus => {
            if current_player_id.is_none() || current_table_id.is_none() {
                return;
            }
            let current_table_id_ref = current_table_id.as_ref().unwrap();
            let curent_player_id_ref = current_player_id.as_ref().unwrap();
            get_status(
                game,
                ws_channel_sender,
                &curent_player_id_ref,
                &current_table_id_ref,
            )
            .await;
        }
        RequestMessages::AddBet {
            label,
            placement,
            local_position,
            amount,
        } => {
            if current_player_id.is_none() || current_table_id.is_none() {
                return;
            }
            let current_table_id_ref = current_table_id.as_ref().unwrap();
            let curent_player_id_ref = current_player_id.as_ref().unwrap();
            add_bet(
                game,
                ws_channel_sender,
                curent_player_id_ref,
                current_table_id_ref,
                &label,
                placement,
                local_position,
                amount,
            )
            .await;
        }
        RequestMessages::ClearBets => {
            if current_player_id.is_none() || current_table_id.is_none() {
                return;
            }
            let current_table_id_ref = current_table_id.as_ref().unwrap();
            let curent_player_id_ref = current_player_id.as_ref().unwrap();
            clear_bets(
                game,
                ws_channel_sender,
                &curent_player_id_ref,
                &current_table_id_ref,
            )
            .await;
        }
        RequestMessages::RequestSpin => {
            if current_player_id.is_none() || current_table_id.is_none() {
                return;
            }
            let current_table_id_ref = current_table_id.as_ref().unwrap();
            let curent_player_id_ref = current_player_id.as_ref().unwrap();
            request_spin(
                game,
                ws_channel_sender,
                &curent_player_id_ref,
                &current_table_id_ref,
            )
            .await;
        }
    };
}

pub(crate) async fn join_table(
    game: ArcGame,
    ws_channel_sender: Sender<ResponseMessages>,
    current_player_id: &mut Option<Uuid>,
    current_table_id: &mut Option<TableId>,
    table_id: String,
    player_id: Option<Uuid>,
) {
    let player_id = player_id.unwrap_or(Uuid::new_v4());
    let mut tables = game.tables.lock().await;
    match tables.get_mut(&table_id) {
        Some(table) => {
            let mut players = table.players.lock().await;
            match players.get_mut(&player_id) {
                Some(player) => {
                    player.ws_channel_sender = ws_channel_sender.clone();
                }
                None => {
                    players
                        .insert(
                            player_id,
                            Player::new(ws_channel_sender.clone(), Vec::new()),
                        )
                        .unwrap();
                }
            }
        }
        None => {
            let last_timestamp = Arc::new(Mutex::new(None));
            let players = Arc::new(Mutex::new(HashMap::new()));
            tables
                .insert(
                    table_id.clone(),
                    Table::new(
                        players.clone(),
                        Timmer::new(
                            spin_timmer::spawn_spin_timmer(last_timestamp.clone(), players.clone())
                                .await,
                            last_timestamp,
                        ),
                    ),
                )
                .unwrap();
        }
    }
    ws_channel_sender
        .send(ResponseMessages::JoinTable { player_id })
        .await
        .expect("Unable to send to sender channel of websocket");
    *current_player_id = Some(player_id);
    *current_table_id = Some(table_id);
}

pub(crate) async fn get_status(
    game: ArcGame,
    ws_channel_sender: Sender<ResponseMessages>,
    current_player_id: &PlayerId,
    current_table_id: &TableId,
) {
    let tables = game.tables.lock().await;
    let table = tables.get(current_table_id).expect("Table not found!");
    let players = table.players.lock().await;
    let player = players.get(current_player_id).expect("Player not found!");
    let resp = ResponseMessages::Status {
        status: ws_messages::Status::from_table(table, player, current_player_id),
    };
    ws_channel_sender
        .send(resp)
        .await
        .expect("Unable to send to sender channel of websocket");
}

pub(crate) async fn add_bet(
    game: ArcGame,
    ws_channel_sender: Sender<ResponseMessages>,
    current_player_id: &PlayerId,
    current_table_id: &TableId,
    label: &str,
    placement: Placement,
    local_position: (i32, i32),
    amount: u32,
) {
    let tables = game.tables.lock().await;
    let table = tables.get(current_table_id).expect("Table not found!");

    if table.spin_requests.contains(current_player_id) {
        return;
    }

    let mut players = table.players.lock().await;
    let player = players
        .get_mut(current_player_id)
        .expect("Player not found!");

    let total_bet = player.bets.iter().map(|bet| bet.amount).sum::<u32>() + amount;
    if total_bet > player.balance {
        return;
    }

    player.bets.push(Bet::new(
        label.to_string(),
        placement,
        local_position,
        amount,
    ));

    let resp = ResponseMessages::AddBet {
        bet: ws_messages::Bet::new(label.to_string(), placement, amount),
        balance: player.balance,
        total_bet,
    };

    ws_channel_sender
        .send(resp)
        .await
        .expect("Unable to send to sender channel of websocket");
}

pub(crate) async fn clear_bets(
    game: ArcGame,
    ws_channel_sender: Sender<ResponseMessages>,
    current_player_id: &PlayerId,
    current_table_id: &TableId,
) {
    let tables = game.tables.lock().await;
    let table = tables.get(current_table_id).expect("table not found!");

    if table.spin_requests.contains(current_player_id) {
        return;
    }

    let mut players = table.players.lock().await;
    let player = players
        .get_mut(current_player_id)
        .expect("player not found!");
    player.bets = Vec::new();
    ws_channel_sender
        .send(ResponseMessages::ClearBets)
        .await
        .expect("Unable to send to sender channel of websocket");
}

pub(crate) async fn request_spin(
    game: ArcGame,
    ws_channel_sender: Sender<ResponseMessages>,
    current_player_id: &PlayerId,
    current_table_id: &TableId,
) {
    let tables = game.tables.lock().await;
    let table = tables.get(current_table_id).expect("table not found!");

    if table.spin_requests.contains(current_player_id) {
        return;
    }

    let players = table.players.lock().await;
    let player = players.get(current_player_id).expect("player not found!");
    if player.bets.len() == 0 {
        return;
    }

    let number_of_requestables = players
        .iter()
        .filter(|(_, player)| !player.ws_channel_sender.is_closed())
        .count();

    //TODO: Add logic to send spin request to spinner task
}
