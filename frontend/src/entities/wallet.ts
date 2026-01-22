import { Drawable } from "./traits";
import { ScreenContext } from "../components/game-screen/game-screen";
import { colors } from "./colors";
import { gameState } from "./game-state";

const FONT_HEIGHT = 15;
const LINE_SPACING = 30;

class Wallet implements Drawable {
  private static _instance: Wallet;

  private constructor() { }

  static instance() {
    if (Wallet._instance == undefined) {
      Wallet._instance = new Wallet();
    }

    return Wallet._instance;
  }

  draw(_deltaSeconds: number, context: CanvasRenderingContext2D, _screenContext: ScreenContext) {
    const localShiftX = _screenContext.screen.width - 350, localShiftY = _screenContext.screen.height - 130;
    const playerName = sessionStorage.getItem('roulette_player_name') || 'Unknown';
    const tableId = sessionStorage.getItem('roulette_table_id') || 'Unknown';
    let label = "Bet: ₹" + gameState.totalBetAmount + "\nHolding: ₹" + gameState.balance + "\nPlayer: " + playerName + "\nTable: " + tableId;
    context.font = "bold " + FONT_HEIGHT + "pt Sans";
    context.fillStyle = colors.WHITE;
    label.split("\n").forEach((line, index) => {
      context.fillText(line, localShiftX, localShiftY + LINE_SPACING * index);
    })
  }
}

export { Wallet };
