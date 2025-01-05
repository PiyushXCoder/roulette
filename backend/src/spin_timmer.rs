use std::{collections::HashMap, sync::Arc, time::Duration};

use crate::{
    helper::broadcast_response_message, judge::judge_player, structs, ws_messages::ResponseMessages,
};
use rocket::tokio::{
    self, select,
    sync::{
        mpsc::{self, Sender},
        Mutex,
    },
    time,
};

use self::structs::{Player, PlayerId, Timestamp};

const NUMBER_OF_OPTIONS: u32 = 37;

pub(crate) enum SpinTimmerMessages {
    NewRequest { timestamp: Timestamp },
    SudoRequest,
}

pub(crate) async fn spawn_spin_timmer(
    last_timestamp: Arc<Mutex<Option<Timestamp>>>,
    players: Arc<Mutex<HashMap<PlayerId, Player>>>,
) -> Sender<SpinTimmerMessages> {
    let (spin_timmer_channel_sender, mut spin_timmer_channel_receiver) =
        mpsc::channel::<SpinTimmerMessages>(10);
    let mut interval = time::interval(Duration::from_secs(60));

    tokio::spawn(async move {
        loop {
            select! {
                _ = interval.tick() => {
                    if last_timestamp.lock().await.is_none() {
                        continue;
                    }
                    broadcast_spin_response_message(players.clone()).await;
                    let mut last_timestamp_ref = last_timestamp.lock().await;
                    *last_timestamp_ref = None;
                }
                Some(message) = spin_timmer_channel_receiver.recv() => {
                    let mut last_timestamp_ref = last_timestamp.lock().await;
                    match message {
                        SpinTimmerMessages::NewRequest {timestamp} => {
                            if  last_timestamp_ref.is_none() {
                                interval.reset();
                                *last_timestamp_ref = Some(timestamp);
                                broadcast_response_message(players.clone(), ResponseMessages::BeginSpinTimmer {start: timestamp}).await;
                            }
                        }
                        SpinTimmerMessages::SudoRequest => {
                            broadcast_spin_response_message(players.clone()).await;
                            interval.reset();
                            *last_timestamp_ref = None;
                        }
                    }
                }
            }
        }
    });

    spin_timmer_channel_sender
}

pub(crate) async fn broadcast_spin_response_message(
    players: Arc<Mutex<HashMap<PlayerId, Player>>>,
) {
    let lucky_number = rand::random::<u32>() % (NUMBER_OF_OPTIONS + 1);

    let mut players_ref = players.lock().await;
    for (_, player) in players_ref.iter_mut() {
        if player.ws_channel_sender.is_closed() {
            continue;
        }

        let judgement = judge_player(&player.bets, lucky_number).await;
        player.balance -= judgement.winning_amount - judgement.bet_amount;
        if player.balance < judgement.bet_amount {
            player.bets = Vec::new();
        }
        let response_message = ResponseMessages::Spin {
            lucky_number,
            winning_amount: judgement.winning_amount,
            balance: player.balance,
            bets_cleared: player.balance < judgement.bet_amount,
        };

        player
            .ws_channel_sender
            .send(response_message.clone())
            .await
            .expect("Failed while broadcast");
    }
}
