import { Drawable, Sensible } from "./traits";
import { ScreenContext } from "../components/game-screen/game-screen";
import { colors } from "./colors";

const FONT_HEIGHT = 18;
const BUTTON_PADDING_X = 30;
const BUTTON_PADDING_Y = 15;

class Button implements Drawable, Sensible {
  private static _instances: Map<string, Button> = new Map();
  eventListener: () => void = () => { }
  id: string
  label: string = ""
  width = 0
  height = 0
  private x = 0
  private y = 0
  private is_being_clicked = false

  private constructor(value: string) {
    this.id = value
  }

  static instance(value: string) {
    if (!Button._instances.has(value)) {
      Button._instances.set(value, new Button(value));
    }

    return Button._instances.get(value);
  }

  draw(_deltaSeconds: number, context: CanvasRenderingContext2D, _screenContext: ScreenContext) {
    let label = "Spin";
    context.font = "bold " + FONT_HEIGHT + "pt Sans";
    let labelWidth = context.measureText(label).width;
    const localShiftX = this.x, localShiftY = this.y;
    this.width = labelWidth + 2 * BUTTON_PADDING_X, this.height = FONT_HEIGHT + 2 * BUTTON_PADDING_Y
    context.fillStyle = colors.RED;
    context.fillRect(localShiftX, localShiftY - FONT_HEIGHT, this.width, this.height);
    context.fillStyle = colors.WHITE;
    context.fillText(label, localShiftX + BUTTON_PADDING_X, localShiftY + BUTTON_PADDING_Y);
  }

  setEventListener(eventListener: () => void) {
    this.eventListener = eventListener
  }

  checkSensors(screenContext: ScreenContext): void {
    if (this.is_being_clicked) return;
    const localShiftX = this.x, localShiftY = this.y;
    const width = this.width, height = this.height;
    if (screenContext.events.mouse.down) {
      this.is_being_clicked = true;
      setTimeout(() => { this.is_being_clicked = false; }, 400);
      const mouseEvent = screenContext.events.mouse;
      if (mouseEvent.x >= localShiftX && mouseEvent.x <= localShiftX + width
        && mouseEvent.y >= localShiftY && mouseEvent.y <= localShiftY + height) {
        this.eventListener();
      }
    }
  }

  setLabel(label: string) {
    this.label = label
  }

  setPosition(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

export { Button };
