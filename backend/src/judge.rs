use crate::structs;

use self::structs::{Bet, Placement};

const RED: &str = "red";
const BLACK: &str = "black";
type BoxType = &'static str;

const BOX_COLOR_MAP: [BoxType; 36] = [
    RED, BLACK, RED, BLACK, RED, BLACK, RED, BLACK, RED, BLACK, BLACK, RED, BLACK, RED, BLACK, RED,
    BLACK, RED, RED, BLACK, RED, BLACK, RED, BLACK, RED, BLACK, RED, BLACK, BLACK, RED, BLACK, RED,
    BLACK, RED, BLACK, RED,
];

const BOX_SIZE: i32 = 10; // Used for 0 as it shares edge with 3 blocks

pub(crate) struct Judgement {
    pub(crate) winning_amount: u32,
    pub(crate) bet_amount: u32,
}

fn sanitize(num: i32) -> String {
    match num {
        n if n < 0 => "0".to_string(),
        n if n > 36 => "".to_string(),
        n => n.to_string(),
    }
}

fn range(start: i32, stop: i32, step: i32) -> Vec<String> {
    (start..stop)
        .step_by(step as usize)
        .map(|x| x.to_string())
        .collect()
}

fn get_affected_by_bet(bet: &Bet) -> Vec<String> {
    let mut result = vec![bet.label.clone()];

    if bet.label == "0" {
        if bet.placement == Placement::Right {
            let y = (bet.local_position.1 / BOX_SIZE) + 1;
            result.push(y.to_string());
        }
        return result;
    }

    if bet.label.chars().all(|c| c.is_numeric()) {
        let label_number: i32 = bet.label.parse().unwrap_or(0);

        match label_number % 3 {
            1 => match bet.placement {
                Placement::TopLeft => result.extend(vec![
                    sanitize(label_number - 3),
                    sanitize(label_number - 2),
                    sanitize(label_number - 1),
                    sanitize(label_number + 1),
                    sanitize(label_number + 2),
                ]),
                Placement::TopRight => result.extend(vec![
                    sanitize(label_number + 1),
                    sanitize(label_number + 2),
                    sanitize(label_number + 3),
                    sanitize(label_number + 4),
                    sanitize(label_number + 5),
                ]),
                _ => {}
            },
            2 => match bet.placement {
                Placement::TopLeft => result.extend(vec![
                    sanitize(label_number - 4),
                    sanitize(label_number - 3),
                    sanitize(label_number - 1),
                ]),
                Placement::BottomRight => result.extend(vec![
                    sanitize(label_number + 1),
                    sanitize(label_number + 3),
                    sanitize(label_number + 4),
                ]),
                _ => {}
            },
            0 => match bet.placement {
                Placement::TopLeft => result.extend(vec![
                    sanitize(label_number - 4),
                    sanitize(label_number - 3),
                    sanitize(label_number - 1),
                ]),
                Placement::BottomRight => result.extend(vec![
                    sanitize(label_number - 2),
                    sanitize(label_number - 1),
                    sanitize(label_number + 1),
                    sanitize(label_number + 2),
                    sanitize(label_number + 3),
                ]),
                _ => {}
            },
            _ => {}
        }
        return result;
    }

    match bet.label.as_str() {
        "3rd" => range(1, 37, 3),
        "2nd" => range(2, 37, 3),
        "1st" => range(3, 37, 3),
        "1-12" => range(1, 13, 1),
        "13-24" => range(13, 25, 1),
        "25-36" => range(25, 37, 1),
        "1-18" => range(1, 19, 1),
        "19-36" => range(19, 37, 1),
        "even" => range(2, 37, 2),
        "odd" => range(1, 37, 2),
        "red" => BOX_COLOR_MAP
            .iter()
            .enumerate()
            .filter(|(_, &color)| color == RED)
            .map(|(index, _)| (index + 1).to_string())
            .collect(),
        "black" => BOX_COLOR_MAP
            .iter()
            .enumerate()
            .filter(|(_, &color)| color == BLACK)
            .map(|(index, _)| (index + 1).to_string())
            .collect(),
        _ => vec![],
    }
}

pub(crate) async fn judge_player(bets: &Vec<Bet>, lucky_number: u32) -> Judgement {
    let mut winning_amount = 0;
    let mut bet_amount = 0;
    for bet in bets {
        bet_amount += bet.amount;
        let affected = get_affected_by_bet(bet);
        if affected.contains(&lucky_number.to_string()) {
            winning_amount += match affected.len() {
                18 => 1 * bet.amount,
                12 => 2 * bet.amount,
                6 => 5 * bet.amount,
                4 => 8 * bet.amount,
                3 => 11 * bet.amount,
                2 => 17 * bet.amount,
                1 => 35 * bet.amount,
                _ => 0,
            };
        }
    }

    Judgement {
        winning_amount,
        bet_amount,
    }
}
