import { GameScreen, ScreenContext } from "./components/game-screen/game-screen.tsx"
import "./App.css";
import { colors } from "./entities/colors.ts";
import { Board } from "./entities/board.ts";
import { Chip } from "./entities/chip.ts";
import { Wallet } from "./entities/wallet.ts";

function draw(deltaSeconds: number, context: CanvasRenderingContext2D, screenContext: ScreenContext) {
  context.fillStyle = colors.BOARD;
  context.fillRect(0, 0, screenContext.screen.width, screenContext.screen.height);

  const board = Board.instance();
  board.checkSensors(screenContext);
  board.draw(deltaSeconds, context, screenContext);

  const chipOne = Chip.instance(1);
  chipOne?.setColor(colors.GREEN);
  chipOne?.setAddButtonPosition(0);
  chipOne?.checkSensors(screenContext);
  chipOne?.draw(deltaSeconds, context, screenContext);

  const chipTen = Chip.instance(10);
  chipTen?.setColor(colors.YELLOW);
  chipTen?.setAddButtonPosition(1);
  chipTen?.checkSensors(screenContext);
  chipTen?.draw(deltaSeconds, context, screenContext);

  const chipHundered = Chip.instance(100);
  chipHundered?.setColor(colors.TEAL);
  chipHundered?.setAddButtonPosition(2);
  chipHundered?.checkSensors(screenContext);
  chipHundered?.draw(deltaSeconds, context, screenContext);

  const chipFiveHundered = Chip.instance(500);
  chipFiveHundered?.setColor(colors.BLUE);
  chipFiveHundered?.setAddButtonPosition(3);
  chipFiveHundered?.checkSensors(screenContext);
  chipFiveHundered?.draw(deltaSeconds, context, screenContext);

  Wallet.instance().draw(deltaSeconds, context, screenContext);
}

export { GameScreen };


function App() {
  return (
    <GameScreen draw={draw} />
  )
}

export default App
