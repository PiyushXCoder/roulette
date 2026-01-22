import { Drawable, Sensible } from "./traits";
import { ScreenContext } from "../components/game-screen/game-screen";
import { colors } from "./colors";
import { gameState } from "./game-state";

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
  private customFontHeight: number | null = null
  private skipDisabledCheck: boolean = false

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
    // Check game state for button state
    const timeRemaining = gameState.getSpinTimeRemaining();
    const isDisabled = !this.skipDisabledCheck && (gameState.spinRequested || gameState.isSpinning || gameState.bets.length === 0);

    const fontHeight = this.customFontHeight ?? FONT_HEIGHT;
    let label = this.skipDisabledCheck
      ? this.label
      : timeRemaining > 0
        ? `Spinning in ${timeRemaining}s`
        : gameState.isSpinning
          ? "Spinning..."
          : this.label || "Spin";

    context.font = "bold " + fontHeight + "pt Sans";
    let labelWidth = context.measureText(label).width;
    const localShiftX = this.x, localShiftY = this.y;
    const paddingX = this.customFontHeight ? 15 : BUTTON_PADDING_X;
    const paddingY = this.customFontHeight ? 8 : BUTTON_PADDING_Y;
    this.width = labelWidth + 2 * paddingX, this.height = fontHeight + 2 * paddingY

    // Set button color based on state
    if (isDisabled) {
      context.fillStyle = colors.BLACK; // Disabled
    } else {
      context.fillStyle = colors.RED; // Active
    }

    context.fillRect(localShiftX, localShiftY - fontHeight, this.width, this.height);
    context.fillStyle = colors.WHITE;
    context.fillText(label, localShiftX + paddingX, localShiftY + paddingY);
  }

  setEventListener(eventListener: () => void) {
    this.eventListener = eventListener
  }

  checkSensors(screenContext: ScreenContext): void {
    if (this.is_being_clicked) return;

    // Check if button is disabled (skip for buttons that don't depend on game state)
    if (!this.skipDisabledCheck) {
      const isDisabled = gameState.spinRequested || gameState.isSpinning || gameState.bets.length === 0;
      if (isDisabled) return; // Don't respond to clicks when disabled
    }

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

  setSmall(small: boolean) {
    this.customFontHeight = small ? 12 : null;
  }

  setSkipDisabledCheck(skip: boolean) {
    this.skipDisabledCheck = skip;
  }
}

export { Button };
