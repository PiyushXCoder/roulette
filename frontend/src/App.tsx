import { GameScreen, ScreenContext } from "./components/game-screen/game-screen.tsx"
import "./App.css";
import { colors } from "./entities/colors.ts";
import { Board } from "./entities/board.ts";
import { Chip } from "./entities/chip.ts";
import { Wallet } from "./entities/wallet.ts";
import { Wheel } from "./entities/wheel.ts";
import { StatusMessage } from "./entities/status_message.ts";
import { SpinButton } from "./entities/spin_button.ts";

function draw(deltaSeconds: number, context: CanvasRenderingContext2D, screenContext: ScreenContext) {
  context.fillStyle = colors.BOARD;
  context.fillRect(0, 0, screenContext.screen.width, screenContext.screen.height);

  const wheel = Wheel.instance();
  const board = Board.instance();
  const chipOne = Chip.instance(1);
  const chipTen = Chip.instance(10);
  const chipHundered = Chip.instance(100);
  const chipFiveHundered = Chip.instance(500);
  const wallet = Wallet.instance();
  const statusMessage = StatusMessage.instance();
  const spinButton = SpinButton.instance();

  if (wheel.hidden) board.checkSensors(screenContext);
  board.draw(deltaSeconds, context, screenContext);

  chipOne?.setColor(colors.GREEN);
  chipOne?.setAddButtonPosition(0);
  if (wheel.hidden) chipOne?.checkSensors(screenContext);
  chipOne?.draw(deltaSeconds, context, screenContext);

  chipTen?.setColor(colors.YELLOW);
  chipTen?.setAddButtonPosition(1);
  if (wheel.hidden) chipTen?.checkSensors(screenContext);
  chipTen?.draw(deltaSeconds, context, screenContext);

  chipHundered?.setColor(colors.TEAL);
  chipHundered?.setAddButtonPosition(2);
  if (wheel.hidden) chipHundered?.checkSensors(screenContext);
  chipHundered?.draw(deltaSeconds, context, screenContext);

  chipFiveHundered?.setColor(colors.BLUE);
  chipFiveHundered?.setAddButtonPosition(3);
  if (wheel.hidden) chipFiveHundered?.checkSensors(screenContext);
  chipFiveHundered?.draw(deltaSeconds, context, screenContext);

  wallet.draw(deltaSeconds, context, screenContext);

  wheel.checkSensors(screenContext);
  wheel.draw(deltaSeconds, context, screenContext);

  statusMessage.draw(deltaSeconds, context, screenContext);

  spinButton.draw(deltaSeconds, context, screenContext);
}

export { GameScreen };


function App() {
  return (
    <GameScreen draw={draw} />
  )
}

export default App
