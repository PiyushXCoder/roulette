import { GameScreen, ScreenContext } from "./components/game-screen/game-screen.tsx"
import "./App.css";

let x = 0;

function draw(deltaSeconds: number, context: CanvasRenderingContext2D, screenContext: ScreenContext) {
  console.log(deltaSeconds);
  context.clearRect(0, 0, 1000 + 4, 500 + 4);
  context.fillStyle = "#f00";

  if (screenContext.events.mouse.down) {
    context.fillRect(0, 0, 100, 100);
  }

  context.fillStyle = "#0f0";
  context.fillRect(x, 300, 50, 50);
  x += 50 * deltaSeconds;

  context.fillStyle = "#00f";
  context.fillRect(screenContext.events.mouse.x - 8, screenContext.events.mouse.y - 8, 16, 16);
}

export { GameScreen };


function App() {
  return (
    <GameScreen draw={draw} />
  )
}

export default App
