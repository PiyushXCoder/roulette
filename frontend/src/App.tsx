import { GameScreen, ScreenContext } from "./components/game-screen/game-screen.tsx"
import "./App.css";
import { colors } from "./entities/colors.ts";
import { Board } from "./entities/board.ts";
import { Chip } from "./entities/chip.ts";
import { Wallet } from "./entities/wallet.ts";

function draw(deltaSeconds: number, context: CanvasRenderingContext2D, screenContext: ScreenContext) {
  context.fillStyle = colors.BOARD;
  context.fillRect(0, 0, screenContext.screen.width, screenContext.screen.height);

  Board.instance().draw(deltaSeconds, context, screenContext);

  Chip.instance(colors.YELLOW, 10)?.draw(deltaSeconds, context, screenContext);

  Wallet.instance().draw(deltaSeconds, context, screenContext);
}

export { GameScreen };


function App() {
  return (
    <GameScreen draw={draw} />
  )
}

export default App
