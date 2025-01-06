use rocket::tokio::sync::{mpsc::Sender, Mutex};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};
use uuid::Uuid;

use crate::{spin_timmer::SpinTimmerMessages, ws_messages::ResponseMessages};

pub(crate) const DEFAULT_BALANCE: i32 = 2500;

pub(crate) type Timestamp = i64;
pub(crate) type TableId = String;
pub(crate) type PlayerId = Uuid;

#[derive(Debug)]
pub(crate) struct Game {
    pub(crate) tables: Arc<Mutex<HashMap<TableId, Table>>>,
}

#[derive(Debug)]
pub(crate) struct Table {
    pub(crate) players: Arc<Mutex<HashMap<PlayerId, Player>>>,
    pub(crate) spin_requests: HashSet<PlayerId>,
    pub(crate) spin_timmer: SpinTimmer,
}

#[derive(Debug)]
pub(crate) struct Player {
    pub(crate) ws_channel_sender: Sender<ResponseMessages>,
    pub(crate) bets: Vec<Bet>,
    pub(crate) balance: i32,
}

#[derive(Debug)]
pub(crate) struct Bet {
    pub(crate) label: String,
    pub(crate) placement: Placement,
    pub(crate) local_position: (i32, i32),
    pub(crate) amount: i32,
}

#[derive(Debug)]
pub(crate) struct SpinTimmer {
    pub(crate) spin_timmer_channel_sender: Sender<SpinTimmerMessages>,
    #[allow(unused)]
    pub(crate) last_timestamp: Arc<Mutex<Option<Timestamp>>>,
}

#[derive(Debug, PartialEq, Clone, Copy, Serialize, Deserialize)]
pub(crate) enum Placement {
    #[serde(rename = "topleft")]
    TopLeft,
    #[serde(rename = "topright")]
    TopRight,
    #[serde(rename = "bottomleft")]
    BottomLeft,
    #[serde(rename = "bottomright")]
    BottomRight,
    #[serde(rename = "left")]
    Left,
    #[serde(rename = "right")]
    Right,
    #[serde(rename = "top")]
    Top,
    #[serde(rename = "bottom")]
    Bottom,
    #[serde(rename = "center")]
    Center,
}

impl Default for Game {
    fn default() -> Self {
        Self {
            tables: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

impl Table {
    pub(crate) fn new(players: Arc<Mutex<HashMap<PlayerId, Player>>>, timmer: SpinTimmer) -> Self {
        Self {
            players,
            spin_timmer: timmer,
            spin_requests: HashSet::new(),
        }
    }
}

impl Player {
    pub(crate) fn new(ws_channel_sender: Sender<ResponseMessages>, bets: Vec<Bet>) -> Self {
        Self {
            ws_channel_sender,
            bets,
            balance: DEFAULT_BALANCE,
        }
    }
}

impl Bet {
    pub(crate) fn new(
        label: String,
        placement: Placement,
        local_position: (i32, i32),
        amount: i32,
    ) -> Self {
        Self {
            label,
            placement,
            local_position,
            amount,
        }
    }
}

impl SpinTimmer {
    pub(crate) fn new(
        sender_channel: Sender<SpinTimmerMessages>,
        last_timestamp: Arc<Mutex<Option<Timestamp>>>,
    ) -> Self {
        Self {
            spin_timmer_channel_sender: sender_channel,
            last_timestamp,
        }
    }
}
