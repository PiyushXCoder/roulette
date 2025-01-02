import { GameScreen, ScreenContext } from "./components/game-screen/game-screen.tsx"
import "./App.css";
import { colors } from "./entities/colors.ts";
import { Board } from "./entities/Board.ts";
import { Chip } from "./entities/chip.ts";

function draw(deltaSeconds: number, context: CanvasRenderingContext2D, screenContext: ScreenContext) {
  context.fillStyle = colors.BOARD;
  context.fillRect(0, 0, screenContext.screen.width, screenContext.screen.height);

  let board = new Board();
  board.draw(deltaSeconds, context, screenContext);

  let chipOne = new Chip(colors.GREEN, 1000);
  chipOne.draw(deltaSeconds, context, screenContext);
}

export { GameScreen };


function App() {
  return (
    <GameScreen draw={draw} />
  )
}

export default App
