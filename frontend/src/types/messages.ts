// Types matching backend WebSocket protocol

export type Placement =
    | "topleft"
    | "topright"
    | "bottomleft"
    | "bottomright"
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "center";

// Request Messages (sent from frontend to backend)
export type JoinTableRequest = {
    JoinTable: {
        table_id: string;
        player_id?: string;
        name: string;
    };
};

export type AddBetRequest = {
    AddBet: {
        label: string;
        placement: Placement;
        local_position: [number, number];
        amount: number;
    };
};

export type ClearBetsRequest = "ClearBets";

export type RequestSpinRequest = "RequestSpin";

export type GetStatusRequest = "GetStatus";

export type ListPlayersRequest = "ListPlayers";

export type RequestMessage =
    | JoinTableRequest
    | AddBetRequest
    | ClearBetsRequest
    | RequestSpinRequest
    | GetStatusRequest
    | ListPlayersRequest;

// Response Messages (sent from backend to frontend)
export interface Bet {
    label: string;
    placement: Placement;
    amount: number;
}

export interface Status {
    bets: Bet[];
    balance: number;
    spin_requested: boolean;
}

export interface Player {
    name: string;
    id_hash: string;
    bet_amount: number;
}

export type JoinTableResponse = {
    JoinTable: {
        player_id: string;
    };
};

export type StatusResponse = {
    Status: {
        status: Status;
    };
};

export type AddBetResponse = {
    AddBet: {
        bet: Bet;
        balance: number;
        total_bet: number;
    };
};

export type ClearBetsResponse = "ClearBets";

export type SpinResponse = {
    Spin: {
        lucky_number: number;
        winning_amount: number;
        balance: number;
        bets_cleared: boolean;
    };
};

export type BeginSpinTimmerResponse = {
    BeginSpinTimmer: {
        start: number;
    };
};

export type SomePlayerJoinedResponse = {
    SomePlayerJoined: {
        hash_id: string;
        name: string;
        bet_amount: number;
    };
};

export type SomePlayerLeftResponse = {
    SomePlayerLeft: {
        hash_id: string;
    };
};

export type ListPlayersResponse = {
    ListPlayers: {
        players: Player[];
    };
};

export type ErrorResponse = {
    Error: {
        msg: string;
    };
};

export type ResponseMessage =
    | JoinTableResponse
    | StatusResponse
    | AddBetResponse
    | ClearBetsResponse
    | SpinResponse
    | BeginSpinTimmerResponse
    | SomePlayerJoinedResponse
    | SomePlayerLeftResponse
    | ListPlayersResponse
    | ErrorResponse;
