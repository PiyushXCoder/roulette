import { ScreenContext } from "../components/game-screen/game-screen";
import { Chip } from "./chip";
import { colors } from "./colors";
import { Drawable, Sensible } from "./traits";

const RED = colors.RED, BLACK = colors.BLACK;
type BoxType = typeof RED | typeof BLACK;
const BOX_COLOR_MAP: BoxType[] = [
  RED, BLACK, RED,
  BLACK, RED, BLACK,
  RED, BLACK, RED,
  BLACK, BLACK, RED,
  BLACK, RED, BLACK,
  RED, BLACK, RED,
  RED, BLACK, RED,
  BLACK, RED, BLACK,
  RED, BLACK, RED,
  BLACK, BLACK, RED,
  BLACK, RED, BLACK,
  RED, BLACK, RED,
];
const BOX_SIZE = 70;
const LABEL_HEIGHT = 30;
const LINE_WIDTH = 5;
const BOUNDARY_WIDTH = 10;

const TOP_LEFT = "topleft";
const TOP_RIGHT = "topright";
const BOTTOM_LEFT = "bottomleft";
const BOTTOM_RIGHT = "bottomright";
const LEFT = "left";
const RIGHT = "right";
const TOP = "top";
const BOTTOM = "bottom";
const CENTER = "center";
interface CollisionResult {
  label: string
  type: typeof TOP_LEFT |
  typeof TOP_RIGHT |
  typeof BOTTOM_LEFT |
  typeof BOTTOM_RIGHT |
  typeof LEFT |
  typeof RIGHT |
  typeof TOP |
  typeof BOTTOM |
  typeof CENTER,
  localPosition: [number, number]
}

class Board implements Drawable, Sensible {
  private static _instance: Board;
  highlighted: string[] = []
  boundaries: Map<string, number[]> = new Map()

  private constructor() { }

  static instance() {
    if (Board._instance == undefined) {
      Board._instance = new Board();
    }

    return Board._instance;
  }

  draw(_deltaSeconds: number, context: CanvasRenderingContext2D, _screenContext: ScreenContext) {
    let shiftX = 10, shiftY = 30;
    context.setLineDash([]);

    // "0" BOX 
    let localShiftX = shiftX;
    let localShiftY = shiftY;
    this.drawBox(context, "0", shiftX, shiftY, BOX_SIZE, 3 * BOX_SIZE);


    // Numbered Boxes
    localShiftX = shiftX + BOX_SIZE;
    localShiftY = shiftY;
    let col = 0, row = 0;
    BOX_COLOR_MAP.forEach((boxColor, index) => {
      context.fillStyle = boxColor;
      context.beginPath()
      context.arc(col * BOX_SIZE + BOX_SIZE / 2 + localShiftX, row * BOX_SIZE + BOX_SIZE / 2 + localShiftY, BOX_SIZE / 2 - LINE_WIDTH, 0, 2 * Math.PI);
      context.fill();
      this.drawBox(context, String(index + 1), col * BOX_SIZE + localShiftX, row * BOX_SIZE + localShiftY, BOX_SIZE, BOX_SIZE);
      if ((index + 1) % 3 == 0) {
        row = 0; col += 1;
      } else row += 1;
    });

    // Row Selector
    localShiftX = shiftX + 13 * BOX_SIZE;
    localShiftY = shiftY;
    this.drawBox(context, "3rd", localShiftX, localShiftY, BOX_SIZE, BOX_SIZE);
    this.drawBox(context, "2nd", localShiftX, localShiftY + BOX_SIZE, BOX_SIZE, BOX_SIZE);
    this.drawBox(context, "1st", localShiftX, localShiftY + 2 * BOX_SIZE, BOX_SIZE, BOX_SIZE);

    // Section Selector
    localShiftX = shiftX + BOX_SIZE;
    localShiftY = shiftY + 3 * BOX_SIZE;
    this.drawBox(context, "1-12", localShiftX, localShiftY, BOX_SIZE * 4, BOX_SIZE);
    this.drawBox(context, "13-24", localShiftX + BOX_SIZE * 4, localShiftY, BOX_SIZE * 4, BOX_SIZE);
    this.drawBox(context, "25-36", localShiftX + BOX_SIZE * 4 * 2, localShiftY, BOX_SIZE * 4, BOX_SIZE);

    // Special Section Selector
    localShiftX = shiftX + BOX_SIZE;
    localShiftY = shiftY + 4 * BOX_SIZE;
    this.drawBox(context, "1-18", localShiftX, localShiftY, BOX_SIZE * 2, BOX_SIZE);
    this.drawBox(context, "even", localShiftX + BOX_SIZE * 2, localShiftY, BOX_SIZE * 2, BOX_SIZE);
    context.fillStyle = RED;
    context.fillRect(localShiftX + BOX_SIZE * 2 * 2 + LINE_WIDTH, localShiftY + LINE_WIDTH, BOX_SIZE * 2 - 2 * LINE_WIDTH, BOX_SIZE - 2 * LINE_WIDTH);
    this.drawBox(context, "red", localShiftX + BOX_SIZE * 2 * 2, localShiftY, BOX_SIZE * 2, BOX_SIZE);
    context.fillStyle = BLACK;
    context.fillRect(localShiftX + BOX_SIZE * 2 * 3 + LINE_WIDTH, localShiftY + LINE_WIDTH, BOX_SIZE * 2 - 2 * LINE_WIDTH, BOX_SIZE - 2 * LINE_WIDTH);
    this.drawBox(context, "black", localShiftX + BOX_SIZE * 2 * 3, localShiftY, BOX_SIZE * 2, BOX_SIZE);
    this.drawBox(context, "odd", localShiftX + BOX_SIZE * 2 * 4, localShiftY, BOX_SIZE * 2, BOX_SIZE);
    this.drawBox(context, "19-36", localShiftX + BOX_SIZE * 2 * 5, localShiftY, BOX_SIZE * 2, BOX_SIZE);

  }

  checkSensors(screenContext: ScreenContext): void {
    const collision: CollisionResult | null = this.getCollision(screenContext);
    if (collision == null) return;
    const affected = this.getAffedtedByCollision();
  }


  drawBox(context: CanvasRenderingContext2D, label: string, x: number, y: number, width: number, height: number, lineWidth?: number, labelHeight?: number) {
    lineWidth = lineWidth || LINE_WIDTH;
    labelHeight = labelHeight || LABEL_HEIGHT;
    if (this.highlighted.includes(label)) {
      context.fillStyle = colors.YELLOW;
      context.fillRect(x, y, width, height)
    }
    context.strokeStyle = colors.BLACK;
    context.lineWidth = LINE_WIDTH;
    context.strokeRect(x, y, width, height);
    context.fillStyle = colors.WHITE;
    context.font = "bold " + LABEL_HEIGHT + "px Sans";
    let lableWidth = context.measureText(label).width;
    context.fillText(label, x + (width - lableWidth) / 2, y + lineWidth / 2 + labelHeight / 4 + height / 2);
    if (!this.boundaries.has(label))
      this.boundaries.set(label, [x, y, width, height]);
  }

  getCollision(screenContext: ScreenContext): CollisionResult | null {
    if (Chip.getDraggedInstance() == null) return null;


    for (let [label, bound] of this.boundaries.entries()) {
      const [x, y, width, height] = bound;
      const localPosition: [number, number] = [
        screenContext.events.mouse.x - x,
        screenContext.events.mouse.y - y
      ];
      if (label.match(/[^0-9]/g) == null) { // label is only number
        // Check corners
        if (isCollieded(x, y, BOUNDARY_WIDTH, BOUNDARY_WIDTH, screenContext))
          return { label, type: TOP_LEFT, localPosition };
        if (isCollieded(x + width - BOUNDARY_WIDTH, y, BOUNDARY_WIDTH, BOUNDARY_WIDTH, screenContext))
          return { label, type: TOP_RIGHT, localPosition };
        if (isCollieded(x, y + height - BOUNDARY_WIDTH, BOUNDARY_WIDTH, BOUNDARY_WIDTH, screenContext))
          return { label, type: BOTTOM_LEFT, localPosition };
        if (isCollieded(x + width - BOUNDARY_WIDTH, y + height - BOUNDARY_WIDTH, BOUNDARY_WIDTH, BOUNDARY_WIDTH, screenContext))
          return { label, type: BOTTOM_RIGHT, localPosition };

        // Check edges
        if (isCollieded(x, y, BOUNDARY_WIDTH, height, screenContext))
          return { label, type: LEFT, localPosition };
        if (isCollieded(x, y, width, BOUNDARY_WIDTH, screenContext))
          return { label, type: TOP, localPosition };
        if (isCollieded(x + width - BOUNDARY_WIDTH, y, BOUNDARY_WIDTH, height, screenContext))
          return { label, type: RIGHT, localPosition };
        if (isCollieded(x, y + height - BOUNDARY_WIDTH, width, BOUNDARY_WIDTH, screenContext))
          return { label, type: BOTTOM, localPosition };
      }

      // Check whole
      if (isCollieded(x, y, width, height, screenContext))
        return { label, type: CENTER, localPosition };
    }
    return null
  }

  getAffedtedByCollision() {

  }
}

function isCollieded(x: number, y: number, width: number, height: number, screenContext: ScreenContext) {
  const mouseX = screenContext.events.mouse.x;
  const mouseY = screenContext.events.mouse.y;
  return (x <= mouseX && x + width > mouseX && y <= mouseY && y + height > mouseY)
}

export { Board };
