import { Drawable } from "./traits";
import { ScreenContext } from "../components/game-screen/game-screen";
import { colors } from "./colors";

const FONT_HEIGHT = 18;
const BUTTON_PADDING_X = 30;
const BUTTON_PADDING_Y = 15;

class SpinButton implements Drawable {
  private static _instance: SpinButton;
  eventListener: () => void = () => { }

  private constructor() { }

  static instance() {
    if (SpinButton._instance == undefined) {
      SpinButton._instance = new SpinButton();
    }

    return SpinButton._instance;
  }

  draw(_deltaSeconds: number, context: CanvasRenderingContext2D, _screenContext: ScreenContext) {
    let label = "Spin";
    context.font = "bold " + FONT_HEIGHT + "pt Sans";
    let labelWidth = context.measureText(label).width;
    const localShiftX = (_screenContext.screen.width - labelWidth) / 2, localShiftY = _screenContext.screen.height - 100;
    context.fillStyle = colors.RED;
    context.fillRect(localShiftX - BUTTON_PADDING_X, localShiftY - FONT_HEIGHT - BUTTON_PADDING_Y, labelWidth + 2 * BUTTON_PADDING_X, FONT_HEIGHT + 2 * BUTTON_PADDING_Y);
    context.fillStyle = colors.WHITE;
    context.fillText(label, localShiftX, localShiftY);
  }

  setEventListener(eventListener: () => void) {
    this.eventListener = eventListener
  }
}

export { SpinButton };
