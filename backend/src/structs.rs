use rocket::tokio::sync::{mpsc::Sender, Mutex};
use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};
use uuid::Uuid;

use crate::ws_messages::ResponseMessages;

pub(crate) const DEFAULT_BALANCE: u32 = 2500;

pub(crate) type Timestamp = u64;
pub(crate) type TableId = String;
pub(crate) type PlayerId = Uuid;

pub(crate) struct Game {
    pub(crate) tables: Arc<Mutex<HashMap<TableId, Table>>>,
}

pub(crate) struct Table {
    pub(crate) players: Arc<Mutex<HashMap<PlayerId, Player>>>,
    pub(crate) spin_requests: HashSet<PlayerId>,
    pub(crate) timmer: Timmer,
}

pub(crate) struct Player {
    pub(crate) sender_channel: Sender<ResponseMessages>,
    pub(crate) bets: Vec<Bet>,
    pub(crate) balance: u32,
}

pub(crate) struct Bet {
    pub(crate) label: String,
    pub(crate) placement: String,
    pub(crate) amount: u32,
}

pub(crate) struct Timmer {
    pub(crate) sender_channel: Sender<Timestamp>,
    pub(crate) last_timestamp: Arc<Mutex<Option<Timestamp>>>,
}

impl Default for Game {
    fn default() -> Self {
        Self {
            tables: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

impl Table {
    pub(crate) fn new(players: Arc<Mutex<HashMap<PlayerId, Player>>>, timmer: Timmer) -> Self {
        Self {
            players,
            timmer,
            spin_requests: HashSet::new(),
        }
    }
}

impl Player {
    pub(crate) fn new(sender_channel: Sender<ResponseMessages>, bets: Vec<Bet>) -> Self {
        Self {
            sender_channel,
            bets,
            balance: DEFAULT_BALANCE,
        }
    }
}

impl Bet {
    pub(crate) fn new(label: String, placement: String, amount: u32) -> Self {
        Self {
            label,
            placement,
            amount,
        }
    }
}

impl Timmer {
    pub(crate) fn new(
        sender_channel: Sender<Timestamp>,
        last_timestamp: Arc<Mutex<Option<Timestamp>>>,
    ) -> Self {
        Self {
            sender_channel,
            last_timestamp,
        }
    }
}
