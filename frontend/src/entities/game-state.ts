import type { Bet, Status, Player, SpinResponse, AddBetResponse } from "../types/messages";

const DEFAULT_BALANCE = 2500;

class GameState {
    private static _instance: GameState;

    balance: number = DEFAULT_BALANCE;
    bets: Bet[] = [];
    totalBetAmount: number = 0;
    spinRequested: boolean = false;
    players: Player[] = [];
    isSpinning: boolean = false;
    spinTimerStart: number | null = null;
    lastLuckyNumber: number | null = null;
    lastWinningAmount: number = 0;
    private pendingBalance: number | null = null;

    private constructor() { }

    static instance(): GameState {
        if (!GameState._instance) {
            GameState._instance = new GameState();
        }
        return GameState._instance;
    }

    updateFromStatus(status: Status): void {
        this.bets = status.bets;
        this.balance = status.balance;
        this.spinRequested = status.spin_requested;
        this.totalBetAmount = status.bets.reduce((sum, bet) => sum + bet.amount, 0);
    }

    addBet(response: AddBetResponse): void {
        this.bets.push(response.AddBet.bet);
        this.balance = response.AddBet.balance;
        this.totalBetAmount = response.AddBet.total_bet;
    }

    clearBets(): void {
        this.bets = [];
        this.totalBetAmount = 0;
    }

    handleSpin(spinResult: SpinResponse): void {
        console.log("handleSpin received:", spinResult);
        console.log("Current balance before spin:", this.balance);
        console.log("Pending balance will be:", spinResult.Spin.balance);
        this.lastLuckyNumber = spinResult.Spin.lucky_number;
        this.lastWinningAmount = spinResult.Spin.winning_amount;
        // Store pending balance - will be applied when wheel stops
        this.pendingBalance = spinResult.Spin.balance;
        this.isSpinning = true;
        this.spinRequested = false;
        this.spinTimerStart = null;

        if (spinResult.Spin.bets_cleared) {
            this.bets = [];
            this.totalBetAmount = 0;
        }
    }

    // Called when wheel animation completes
    onWheelStopped(): void {
        console.log("onWheelStopped called");
        console.log("pendingBalance:", this.pendingBalance);
        console.log("Current balance:", this.balance);
        if (this.pendingBalance !== null) {
            this.balance = this.pendingBalance;
            console.log("Balance updated to:", this.balance);
            this.pendingBalance = null;
        }
        this.isSpinning = false;
    }

    beginSpinTimer(timestamp: number): void {
        this.spinTimerStart = timestamp;
        this.spinRequested = true;
    }

    updatePlayers(players: Player[]): void {
        this.players = players;
    }

    addPlayer(player: Player): void {
        // Check if player already exists
        const existingIndex = this.players.findIndex((p) => p.id_hash === player.id_hash);
        if (existingIndex === -1) {
            this.players.push(player);
        }
    }

    removePlayer(hashId: string): void {
        this.players = this.players.filter((p) => p.id_hash !== hashId);
    }

    reset(): void {
        this.balance = DEFAULT_BALANCE;
        this.bets = [];
        this.totalBetAmount = 0;
        this.spinRequested = false;
        this.players = [];
        this.isSpinning = false;
        this.spinTimerStart = null;
        this.lastLuckyNumber = null;
        this.lastWinningAmount = 0;
    }

    getSpinTimeRemaining(): number {
        if (!this.spinTimerStart) return 0;
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - this.spinTimerStart;
        const remaining = 60 - elapsed;
        return Math.max(0, remaining);
    }
}

export const gameState = GameState.instance();
