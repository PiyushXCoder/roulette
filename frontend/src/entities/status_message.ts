import { Drawable } from "./traits";
import { ScreenContext } from "../components/game-screen/game-screen";
import { colors } from "./colors";

const FONT_HEIGHT = 14;
const LINE_SPACING = 28;

class StatusMessage implements Drawable {
  private static _instance: StatusMessage;
  message: string = ""

  private constructor() { }

  static instance() {
    if (StatusMessage._instance == undefined) {
      StatusMessage._instance = new StatusMessage();
    }

    return StatusMessage._instance;
  }

  draw(_deltaSeconds: number, context: CanvasRenderingContext2D, _screenContext: ScreenContext) {
    let label = this.message;
    let labelWidth = context.measureText(label).width;
    const localShiftX = (_screenContext.screen.width - labelWidth) / 2, localShiftY = _screenContext.screen.height - 30;
    context.font = "bold " + FONT_HEIGHT + "pt Sans";
    context.fillStyle = colors.WHITE;
    label.split("\n").forEach((line, index) => {
      context.fillText(line, localShiftX, localShiftY + LINE_SPACING * index);
    })
  }

  setMessage(message: string) {
    this.message = message;
  }
}

export { StatusMessage };
