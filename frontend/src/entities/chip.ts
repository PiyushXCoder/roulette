import { Drawable, Sensible } from "./traits";
import { ScreenContext } from "../components/game-screen/game-screen";
import { colors } from "./colors";
import { CollisionResult } from "./board";
import { wsManager } from "../websocket";
import { gameState } from "./game-state";
import type { Placement } from "../types/messages";

const SHADOW_SHIFT = 3;
const LINE_WIDTH = 10;
const DASH_INTERVAL = 5;
const CHIP_RADIUS = 25;
const DASHED_ARC_RADIUS = 20;
const FONT_HEIGHT = 11;
const ADD_BUTTON_SPACING = 70;

type ChipValue = number;

class Chip implements Drawable, Sensible {
  color: string = colors.YELLOW;
  value: number = 0
  addButtonPosition: number = 0
  isDragged: boolean = false
  // Stores visual positions for bets (keyed by label+placement for quick lookup)
  betVisualPositions: Map<string, { x: number, y: number }> = new Map();

  private static _instances: Map<ChipValue, Chip> = new Map();
  private static _draggedInstance: Chip | null = null;

  private constructor(value: ChipValue) {
    this.value = value
  }

  static instance(value: ChipValue) {
    if (!Chip._instances.has(value)) {
      Chip._instances.set(value, new Chip(value));
    }

    return Chip._instances.get(value);
  }

  static getDraggedInstance() {
    return this._draggedInstance;
  }

  setColor(color: string) {
    this.color = color;
  }

  setAddButtonPosition(pos: number) {
    this.addButtonPosition = pos;
  }

  draw(_deltaSeconds: number, context: CanvasRenderingContext2D, _screenContext: ScreenContext) {
    let localShiftX = 100 + this.addButtonPosition * ADD_BUTTON_SPACING, localShiftY = _screenContext.screen.height - 100;
    this.drawChip(context, localShiftX, localShiftY);

    // Render chip for dragging
    if (this.isDragged) {
      localShiftX = _screenContext.events.mouse.x - CHIP_RADIUS + LINE_WIDTH / 2, localShiftY = _screenContext.events.mouse.y - CHIP_RADIUS + LINE_WIDTH / 2;
      this.drawChip(context, localShiftX, localShiftY, true);
    }

    // Draw bets from server state
    for (const bet of gameState.bets) {
      if (bet.amount === this.value) {
        const key = `${bet.label}-${bet.placement}`;
        const pos = this.betVisualPositions.get(key);
        if (pos) {
          localShiftX = pos.x - CHIP_RADIUS + LINE_WIDTH / 2;
          localShiftY = pos.y - CHIP_RADIUS + LINE_WIDTH / 2;
          this.drawChip(context, localShiftX, localShiftY);
        }
      }
    }
  }

  drawChip(context: CanvasRenderingContext2D, x: number, y: number, hasShadow?: boolean) {
    hasShadow = hasShadow || false;

    if (hasShadow) {
      context.beginPath();
      context.fillStyle = colors.BLACK;
      context.arc(x + DASHED_ARC_RADIUS + SHADOW_SHIFT, y + DASHED_ARC_RADIUS + SHADOW_SHIFT, CHIP_RADIUS, 0, 2 * Math.PI);
      context.fill();
    }

    context.beginPath();
    context.fillStyle = this.color;
    context.arc(x + DASHED_ARC_RADIUS, y + DASHED_ARC_RADIUS, CHIP_RADIUS, 0, 2 * Math.PI);
    context.fill();
    context.beginPath();
    context.strokeStyle = colors.WHITE;
    context.setLineDash([DASH_INTERVAL, DASH_INTERVAL])
    context.lineWidth = LINE_WIDTH;
    context.arc(x + DASHED_ARC_RADIUS, y + DASHED_ARC_RADIUS, DASHED_ARC_RADIUS, 0, 2 * Math.PI);
    context.stroke();
    context.fillStyle = colors.BLACK;
    context.font = "bold " + FONT_HEIGHT + "pt Sans";
    let labelWidth = context.measureText(String(this.value)).width;
    context.fillText(String(this.value), x + DASHED_ARC_RADIUS - labelWidth / 2, y + DASHED_ARC_RADIUS + FONT_HEIGHT / 2)
  }

  checkSensors(_screenContext: ScreenContext): void {
    const localShiftX = 100 + this.addButtonPosition * ADD_BUTTON_SPACING - DASHED_ARC_RADIUS / 2, localShiftY = _screenContext.screen.height - 100 - DASHED_ARC_RADIUS / 2;
    const width = 2 * CHIP_RADIUS, height = 2 * CHIP_RADIUS;
    if (_screenContext.events.mouse.down && !_screenContext.events.mouse.dragged) {
      const mouseEvent = _screenContext.events.mouse;
      if (mouseEvent.x >= localShiftX && mouseEvent.x <= localShiftX + width
        && mouseEvent.y >= localShiftY && mouseEvent.y <= localShiftY + height) {
        this.isDragged = true;
        Chip._draggedInstance = this;
      }
    } else if (!_screenContext.events.mouse.down) {
      this.isDragged = false;
      Chip._draggedInstance = null;
    }
  }

  addBet(collision: CollisionResult, drawPosition: [number, number]) {
    const [x, y] = drawPosition;

    // Store visual position
    const key = `${collision.label}-${collision.placement}`;
    this.betVisualPositions.set(key, { x, y });

    // Send to server
    wsManager.sendAddBet(
      collision.label,
      collision.placement as Placement,
      [collision.localPosition.x, collision.localPosition.y],
      this.value
    );
  }

  clearBets() {
    this.betVisualPositions.clear();
  }

  static clearAllBets() {
    Chip._instances.forEach(chip => chip?.clearBets());
  }
}

export { Chip };
