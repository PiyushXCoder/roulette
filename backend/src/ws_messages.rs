use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::structs::{self, PlayerId, TableId};

use self::structs::{Placement, Timestamp};

#[derive(Debug, Deserialize)]
pub(crate) enum RequestMessages {
    JoinTable {
        table_id: TableId,
        player_id: Option<PlayerId>,
        name: Arc<str>,
    },
    AddBet {
        label: String,
        placement: Placement,
        local_position: (i32, i32),
        amount: i32,
    },
    ClearBets,
    RequestSpin,
    GetStatus,
    ListPlayers,
}

#[derive(Debug, Serialize, Clone)]
pub(crate) enum ResponseMessages {
    JoinTable {
        player_id: PlayerId,
    },
    Status {
        status: Status,
    },
    AddBet {
        bet: Bet,
        balance: i32,
        total_bet: i32,
    },
    ClearBets,
    Spin {
        lucky_number: u32,
        winning_amount: i32,
        balance: i32,
        bets_cleared: bool,
    },
    BeginSpinTimmer {
        start: Timestamp,
    },
    SomePlayerJoined {
        hash_id: Arc<str>,
        name: Arc<str>,
        bet_amount: i32,
    },
    SomePlayerLeft {
        hash_id: Arc<str>,
    },
    ListPlayers {
        players: Vec<Player>,
    },
    Error {
        msg: Arc<str>,
    },
}

#[derive(Debug, Serialize, Clone)]
pub(crate) struct Status {
    pub(crate) bets: Vec<Bet>,
    pub(crate) balance: i32,
    pub(crate) spin_requested: bool,
}

#[derive(Debug, Serialize, Clone)]
pub(crate) struct Bet {
    pub(crate) label: String,
    pub(crate) placement: Placement,
    pub(crate) amount: i32,
}

#[derive(Debug, Serialize, Clone)]
pub(crate) struct Player {
    pub(crate) name: Arc<str>,
    pub(crate) id_hash: Arc<str>,
    pub(crate) bet_amount: i32,
}

impl Bet {
    pub(crate) fn new(label: String, placement: Placement, amount: i32) -> Self {
        Self {
            label,
            placement,
            amount,
        }
    }
}

impl Status {
    pub(crate) fn from_table(
        table: &structs::Table,
        player: &structs::Player,
        player_id: &structs::PlayerId,
    ) -> Self {
        Self {
            bets: player.bets.iter().map(|bet| bet.into()).collect(),
            balance: player.balance,
            spin_requested: table.spin_requests.contains(player_id),
        }
    }
}

impl From<&structs::Bet> for Bet {
    fn from(value: &structs::Bet) -> Self {
        Self {
            label: value.label.clone(),
            placement: value.placement.clone(),
            amount: value.amount,
        }
    }
}

impl Player {
    pub(crate) fn from_player(player: &structs::Player, player_id: &PlayerId) -> Self {
        Self {
            name: player.name.clone().into(),
            id_hash: sha256::digest(player_id.to_string()).into(),
            bet_amount: player.bets.iter().map(|bet| bet.amount).sum(),
        }
    }
}
