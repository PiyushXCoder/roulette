import { Drawable } from "./traits";
import { ScreenContext } from "../components/game-screen/game-screen";
import { colors } from "./colors";

// const SHADOW_SHIFT = 3;
const LINE_WIDTH = 10;
const DASH_INTERVAL = 5;
const CHIP_RADIUS = 25;
const DASHED_ARC_RADIUS = 20;
const FONT_HEIGHT = 15;

class Chip implements Drawable {
  color: string = ""
  value: number = 0

  constructor(color: string, value: number) {
    this.color = color
    this.value = value
  }

  draw(_deltaSeconds: number, context: CanvasRenderingContext2D, _screenContext: ScreenContext) {
    console.log(_screenContext.screen.height);
    const localShiftX = 50, localShiftY = _screenContext.screen.height - 100;

    context.beginPath();
    context.fillStyle = this.color;
    context.arc(localShiftX, localShiftY, CHIP_RADIUS, 0, 2 * Math.PI);
    context.fill();
    context.beginPath();
    context.strokeStyle = colors.WHITE;
    context.setLineDash([DASH_INTERVAL, DASH_INTERVAL])
    context.lineWidth = LINE_WIDTH;
    context.arc(localShiftX, localShiftY, DASHED_ARC_RADIUS, 0, 2 * Math.PI);
    context.stroke();
    context.fillStyle = colors.BLACK;
    context.font = "bold " + FONT_HEIGHT + "px Sans";
    const labelWidth = context.measureText(String(this.value)).width;
    context.fillText(String(this.value), localShiftX - labelWidth / 2, localShiftY + FONT_HEIGHT / 3)

    // TODO: Render chip for dragging
    // TODO: Render poistioned chips too
  }
}

export { Chip };
