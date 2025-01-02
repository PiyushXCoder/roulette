import { ScreenContext } from "../components/game-screen/game-screen";

interface Drawable {
  draw(deltaSeconds: number, context: CanvasRenderingContext2D, screenContext: ScreenContext): void
}

export { type Drawable }
