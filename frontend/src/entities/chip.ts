import { Drawable } from "./traits";
import { ScreenContext } from "../components/game-screen/game-screen";
import { colors } from "./colors";

// const SHADOW_SHIFT = 3;
const LINE_WIDTH = 10;
const DASH_INTERVAL = 5;
const CHIP_RADIUS = 25;
const DASHED_ARC_RADIUS = 20;
const FONT_HEIGHT = 15;
const ADD_BUTTON_SPACING = 70;

type ChipValue = number;

class Chip implements Drawable {
  color: string = colors.YELLOW;
  value: number = 0
  addButtonPosition: number = 0
  private static _instances: Map<ChipValue, Chip> = new Map();

  private constructor(value: ChipValue) {
    this.value = value
  }

  static instance(value: ChipValue) {
    if (!Chip._instances.has(value)) {
      Chip._instances.set(value, new Chip(value));
    }

    return Chip._instances.get(value);
  }

  setColor(color: string) {
    this.color = color;
  }

  setAddButtonPosition(pos: number) {
    this.addButtonPosition = pos;
  }

  draw(_deltaSeconds: number, context: CanvasRenderingContext2D, _screenContext: ScreenContext) {
    const localShiftX = 100 + this.addButtonPosition * ADD_BUTTON_SPACING, localShiftY = _screenContext.screen.height - 100;

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
