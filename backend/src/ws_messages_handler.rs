use std::{collections::HashMap, sync::Arc};

use rocket::{
    serde::json,
    tokio::sync::{mpsc::Sender, Mutex},
};
use rocket_ws::Message;
use uuid::Uuid;

use crate::{
    helper::broadcast_response_message,
    spin_timmer,
    structs::Placement,
    ws_messages::{self, RequestMessages, ResponseMessages},
    ArcGame,
};

use crate::structs::{Bet, Player, PlayerId, SpinTimmer, Table, TableId};

use self::spin_timmer::SpinTimmerMessages;

pub(crate) async fn handle_close(
    game: ArcGame,
    current_player_id: &Option<PlayerId>,
    current_table_id: &Option<TableId>,
) -> anyhow::Result<()> {
    if current_player_id.is_none() || current_table_id.is_none() {
        return Ok(());
    }
    let current_table_id = current_table_id.as_ref().unwrap();
    let current_player_id = current_player_id.as_ref().unwrap();

    let tables = game.tables.lock().await;
    let table = tables
        .get(current_table_id)
        .ok_or(anyhow::anyhow!("Table not found"))?;

    broadcast_response_message(
        table.players.clone(),
        Some(vec![current_player_id.to_owned()]),
        ResponseMessages::SomePlayerLeft {
            hash_id: sha256::digest(current_player_id.to_string()).into(),
        },
    )
    .await?;
    Ok(())
}

pub(crate) async fn handle(
    message: Message,
    game: ArcGame,
    ws_channel_sender: Sender<ResponseMessages>,
    current_player_id: &mut Option<PlayerId>,
    current_table_id: &mut Option<TableId>,
) -> anyhow::Result<()> {
    let request_message: RequestMessages = match message {
        Message::Text(text) => match json::from_str(&text) {
            Ok(req) => req,
            Err(e) => {
                ws_channel_sender
                    .send(ResponseMessages::Error {
                        msg: format!("Bad Request: {:?}", e.to_string()).into(),
                    })
                    .await?;
                return Ok(());
            }
        },
        _ => return Ok(()),
    };

    match request_message {
        RequestMessages::JoinTable {
            table_id,
            player_id,
            name,
        } => {
            join_table(
                game,
                ws_channel_sender,
                current_player_id,
                current_table_id,
                table_id,
                player_id,
                &name,
            )
            .await?;
        }
        RequestMessages::GetStatus => {
            if current_player_id.is_none() || current_table_id.is_none() {
                ws_channel_sender
                    .send(ResponseMessages::Error {
                        msg: "No table has been joined".into(),
                    })
                    .await?;
                return Ok(());
            }
            let current_table_id = current_table_id.as_ref().unwrap();
            let curent_player_id = current_player_id.as_ref().unwrap();
            get_status(
                game,
                ws_channel_sender,
                &curent_player_id,
                &current_table_id,
            )
            .await?;
        }
        RequestMessages::AddBet {
            label,
            placement,
            local_position,
            amount,
        } => {
            if current_player_id.is_none() || current_table_id.is_none() {
                ws_channel_sender
                    .send(ResponseMessages::Error {
                        msg: "No table has been joined".into(),
                    })
                    .await?;
                return Ok(());
            }
            let current_table_id = current_table_id.as_ref().unwrap();
            let curent_player_id = current_player_id.as_ref().unwrap();
            add_bet(
                game,
                ws_channel_sender,
                curent_player_id,
                current_table_id,
                &label,
                placement,
                local_position,
                amount,
            )
            .await?;
        }
        RequestMessages::ClearBets => {
            if current_player_id.is_none() || current_table_id.is_none() {
                ws_channel_sender
                    .send(ResponseMessages::Error {
                        msg: "No table has been joined".into(),
                    })
                    .await?;
                return Ok(());
            }
            let current_table_id = current_table_id.as_ref().unwrap();
            let curent_player_id = current_player_id.as_ref().unwrap();
            clear_bets(
                game,
                ws_channel_sender,
                &curent_player_id,
                &current_table_id,
            )
            .await?;
        }
        RequestMessages::RequestSpin => {
            if current_player_id.is_none() || current_table_id.is_none() {
                ws_channel_sender
                    .send(ResponseMessages::Error {
                        msg: "No table has been joined".into(),
                    })
                    .await?;
                return Ok(());
            }
            let current_table_id = current_table_id.as_ref().unwrap();
            let curent_player_id = current_player_id.as_ref().unwrap();
            request_spin(
                game,
                ws_channel_sender,
                &curent_player_id,
                &current_table_id,
            )
            .await?;
        }
        RequestMessages::ListPlayers => {
            if current_player_id.is_none() || current_table_id.is_none() {
                ws_channel_sender
                    .send(ResponseMessages::Error {
                        msg: "No table has been joined".into(),
                    })
                    .await?;
                return Ok(());
            }
            let current_table_id = current_table_id.as_ref().unwrap();
            let curent_player_id = current_player_id.as_ref().unwrap();
            list_players(
                game,
                ws_channel_sender,
                &curent_player_id,
                &current_table_id,
            )
            .await?;
        }
    };
    return Ok(());
}

pub(crate) async fn join_table(
    game: ArcGame,
    ws_channel_sender: Sender<ResponseMessages>,
    current_player_id: &mut Option<Uuid>,
    current_table_id: &mut Option<TableId>,
    table_id: String,
    player_id: Option<Uuid>,
    name: &str,
) -> anyhow::Result<()> {
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
                    players.insert(
                        player_id,
                        Player::new(ws_channel_sender.clone(), name, Vec::new()),
                    );
                }
            }
        }
        None => {
            let last_timestamp = Arc::new(Mutex::new(None));
            let mut players_hashmap = HashMap::new();
            players_hashmap.insert(
                player_id,
                Player::new(ws_channel_sender.clone(), name, Vec::new()),
            );
            let players = Arc::new(Mutex::new(players_hashmap));

            tables.insert(
                table_id.clone(),
                Table::new(
                    players.clone(),
                    SpinTimmer::new(
                        spin_timmer::spawn_spin_timmer(last_timestamp.clone(), players.clone())
                            .await,
                        last_timestamp,
                    ),
                ),
            );
        }
    }
    ws_channel_sender
        .send(ResponseMessages::JoinTable { player_id })
        .await?;
    *current_player_id = Some(player_id);
    *current_table_id = Some(table_id.clone());

    let tables = game.tables.lock().await;
    let table = tables
        .get(&table_id)
        .ok_or(anyhow::anyhow!("Table not found"))?;
    let bet_amount;
    {
        let players = table.players.lock().await;
        let player = players
            .get(&player_id)
            .ok_or(anyhow::anyhow!("Player not found!"))?;
        bet_amount = player.bets.iter().map(|bet| bet.amount).sum();
    }
    broadcast_response_message(
        table.players.clone(),
        Some(vec![player_id]),
        ResponseMessages::SomePlayerJoined {
            hash_id: sha256::digest(player_id.to_string()).into(),
            name: name.into(),
            bet_amount,
        },
    )
    .await?;
    Ok(())
}

pub(crate) async fn get_status(
    game: ArcGame,
    ws_channel_sender: Sender<ResponseMessages>,
    current_player_id: &PlayerId,
    current_table_id: &TableId,
) -> anyhow::Result<()> {
    let tables = game.tables.lock().await;
    let table = tables
        .get(current_table_id)
        .ok_or(anyhow::anyhow!("Table not found"))?;
    let players = table.players.lock().await;
    let player = players
        .get(current_player_id)
        .ok_or(anyhow::anyhow!("Player not found!"))?;
    let resp = ResponseMessages::Status {
        status: ws_messages::Status::from_table(table, player, current_player_id),
    };
    ws_channel_sender.send(resp).await?;
    Ok(())
}

pub(crate) async fn add_bet(
    game: ArcGame,
    ws_channel_sender: Sender<ResponseMessages>,
    current_player_id: &PlayerId,
    current_table_id: &TableId,
    label: &str,
    placement: Placement,
    local_position: (i32, i32),
    amount: i32,
) -> anyhow::Result<()> {
    let tables = game.tables.lock().await;
    let table = tables
        .get(current_table_id)
        .ok_or(anyhow::anyhow!("Table not found"))?;

    if table.spin_requests.contains(current_player_id) {
        ws_channel_sender
            .send(ResponseMessages::Error {
                msg: "Already requested for spin".into(),
            })
            .await?;
        return Ok(());
    }

    let mut players = table.players.lock().await;
    let player = players
        .get_mut(current_player_id)
        .ok_or(anyhow::anyhow!("Player not found!"))?;

    let total_bet = player.bets.iter().map(|bet| bet.amount).sum::<i32>() + amount;
    if total_bet > player.balance {
        return Ok(());
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

    ws_channel_sender.send(resp).await?;
    Ok(())
}

pub(crate) async fn clear_bets(
    game: ArcGame,
    ws_channel_sender: Sender<ResponseMessages>,
    current_player_id: &PlayerId,
    current_table_id: &TableId,
) -> anyhow::Result<()> {
    let tables = game.tables.lock().await;
    let table = tables
        .get(current_table_id)
        .ok_or(anyhow::anyhow!("Table not found"))?;

    if table.spin_requests.contains(current_player_id) {
        ws_channel_sender
            .send(ResponseMessages::Error {
                msg: "No table has been joined".into(),
            })
            .await?;
        return Ok(());
    }

    let mut players = table.players.lock().await;
    let player = players
        .get_mut(current_player_id)
        .ok_or(anyhow::anyhow!("Player not found!"))?;
    player.bets = Vec::new();
    ws_channel_sender.send(ResponseMessages::ClearBets).await?;
    Ok(())
}

pub(crate) async fn request_spin(
    game: ArcGame,
    ws_channel_sender: Sender<ResponseMessages>,
    current_player_id: &PlayerId,
    current_table_id: &TableId,
) -> anyhow::Result<()> {
    let mut tables = game.tables.lock().await;
    let table = tables
        .get_mut(current_table_id)
        .ok_or(anyhow::anyhow!("Table not found"))?;

    if table.spin_requests.contains(current_player_id) {
        ws_channel_sender
            .send(ResponseMessages::Error {
                msg: "No table has been joined".into(),
            })
            .await?;
        return Ok(());
    }

    let players = table.players.lock().await;
    let player = players
        .get(current_player_id)
        .ok_or(anyhow::anyhow!("Player not found!"))?;
    if player.bets.len() == 0 {
        ws_channel_sender
            .send(ResponseMessages::Error {
                msg: "No bets added".into(),
            })
            .await?;
        return Ok(());
    }

    let number_of_requestables = players
        .iter()
        .filter(|(_, player)| !player.ws_channel_sender.is_closed())
        .count();

    if number_of_requestables == table.spin_requests.len() + 1 {
        table
            .spin_timmer
            .spin_timmer_channel_sender
            .send(SpinTimmerMessages::SudoRequest)
            .await?;
    } else {
        table
            .spin_timmer
            .spin_timmer_channel_sender
            .send(SpinTimmerMessages::NewRequest {
                timestamp: chrono::offset::Utc::now().timestamp(),
            })
            .await?;
        table.spin_requests.insert(current_player_id.to_owned());
    }

    Ok(())
}

pub(crate) async fn list_players(
    game: ArcGame,
    ws_channel_sender: Sender<ResponseMessages>,
    current_player_id: &PlayerId,
    current_table_id: &TableId,
) -> anyhow::Result<()> {
    let tables = game.tables.lock().await;
    let table = tables
        .get(current_table_id)
        .ok_or(anyhow::anyhow!("Table not found"))?;

    if table.spin_requests.contains(current_player_id) {
        ws_channel_sender
            .send(ResponseMessages::Error {
                msg: "No table has been joined".into(),
            })
            .await?;
        return Ok(());
    }

    let players = table.players.lock().await;

    let players = players
        .iter()
        .map(|(player_id, player)| ws_messages::Player::from_player(player, player_id))
        .collect();

    let ws_channel_response_message = ws_messages::ResponseMessages::ListPlayers { players };

    ws_channel_sender.send(ws_channel_response_message).await?;

    Ok(())
}
