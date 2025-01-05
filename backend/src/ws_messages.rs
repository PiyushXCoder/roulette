use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::structs::{self, PlayerId, TableId};

#[derive(Debug, Deserialize)]
pub(crate) enum RequestMessages {
    JoinTable {
        table_id: TableId,
        player_id: Option<PlayerId>,
    },
    AddBet {
        label: String,
        placement: String,
        amount: u32,
    },
    ClearBets,
    RequestSpin,
    GetStatus,
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
        balance: u32,
        total_bet: u32,
    },
    ClearBets,
    Error {
        msg: Arc<str>,
    },
}

#[derive(Debug, Serialize, Clone)]
pub(crate) struct Status {
    pub(crate) bets: Vec<Bet>,
    pub(crate) balance: u32,
    pub(crate) spin_requested: bool,
}

#[derive(Debug, Serialize, Clone)]
pub(crate) struct Bet {
    pub(crate) label: String,
    pub(crate) placement: String,
    pub(crate) amount: u32,
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
