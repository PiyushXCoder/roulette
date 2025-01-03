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
const LABEL_HEIGHT = 20;
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
  localPosition: { x: number, y: number }
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
      this.drawBox(context, String(index + 1), col * BOX_SIZE + localShiftX, row * BOX_SIZE + localShiftY, BOX_SIZE, BOX_SIZE, boxColor);
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
    this.highlighted = [];
    const collision: CollisionResult | null = this.getCollision(screenContext);
    if (collision == null) return;

    if (!screenContext.events.mouse.dragged && Chip.getDraggedInstance() != null) {
      let [x, y, width, height] = this.boundaries.get(collision.label) || [0, 0, 0, 0];
      if (collision.type == TOP_LEFT) x = x, y = y;
      else if (collision.type == TOP_RIGHT) x = x + width, y = y;
      else if (collision.type == BOTTOM_LEFT) x = x, y = y + height;
      else if (collision.type == BOTTOM_RIGHT) x = x + width, y = y + height;
      else if (collision.type == LEFT) x = x, y = y + height / 2;
      else if (collision.type == TOP) x = x + width / 2, y = y;
      else if (collision.type == RIGHT) x = x + width, y = y + height / 2;
      else if (collision.type == BOTTOM) x = x + width / 2, y = y + height;
      else if (collision.type == CENTER) x = x + width / 2, y = y + height / 2;
      Chip.getDraggedInstance()?.addBid(collision, [x, y]);
    }

    const affected = this.getAffedtedByCollision(collision);
    this.highlighted = affected || [];
  }


  drawBox(context: CanvasRenderingContext2D, label: string, x: number, y: number, width: number, height: number, arc?: BoxType) {
    if (this.highlighted.includes(label)) {
      context.fillStyle = colors.YELLOW;
      context.fillRect(x, y, width, height)
    }

    if (arc) {
      context.fillStyle = arc;
      context.beginPath()
      context.arc(x + BOX_SIZE / 2, y + BOX_SIZE / 2, BOX_SIZE / 2 - LINE_WIDTH, 0, 2 * Math.PI);
      context.fill();
    }

    context.strokeStyle = colors.BLACK;
    context.lineWidth = LINE_WIDTH;
    context.strokeRect(x, y, width, height);
    context.fillStyle = colors.WHITE;
    context.font = "bold " + LABEL_HEIGHT + "pt Sans";
    let lableWidth = context.measureText(label).width;
    context.fillText(label, x + (width - lableWidth) / 2, y + LABEL_HEIGHT / 2 + height / 2);
    if (!this.boundaries.has(label))
      this.boundaries.set(label, [x, y, width, height]);
  }

  getCollision(screenContext: ScreenContext): CollisionResult | null {
    if (Chip.getDraggedInstance() == null) return null;


    for (let [label, bound] of this.boundaries.entries()) {
      const [x, y, width, height] = bound;
      const localPosition = {
        x: screenContext.events.mouse.x - x,
        y: screenContext.events.mouse.y - y
      }
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

  getAffedtedByCollision(collision: CollisionResult) {
    if (collision.label == "0") {
      if (collision.type == RIGHT) {
        return [collision.label, String(Math.floor(collision.localPosition.y / BOX_SIZE) + 1)]
      }
      return [collision.label]
    }

    if (collision.label.match(/[^0-9]/g) == null) { // label is only number'
      const labelNumber = Number(collision.label);
      const sanitize = (num: number) => {
        if (num < 0) return "0";
        if (num > 36) return "";
        return (String(num))
      }
      if (labelNumber % 3 == 1) {
        if (collision.type == TOP_LEFT) {
          return [collision.label, sanitize(labelNumber - 3), sanitize(labelNumber - 2), sanitize(labelNumber - 1),
          sanitize(labelNumber + 1), sanitize(labelNumber + 2)]
        } else if (collision.type == TOP_RIGHT) {
          return [collision.label, sanitize(labelNumber + 1), sanitize(labelNumber + 2),
          sanitize(labelNumber + 3), sanitize(labelNumber + 4), sanitize(labelNumber + 5)]
        } else if (collision.type == BOTTOM_LEFT) {
          return [collision.label, sanitize(labelNumber - 3), sanitize(labelNumber - 2), sanitize(labelNumber + 1)]
        } else if (collision.type == BOTTOM_RIGHT) {
          return [collision.label, sanitize(labelNumber + 1), sanitize(labelNumber + 3), sanitize(labelNumber + 4)]
        } else if (collision.type == LEFT) {
          return [collision.label, sanitize(labelNumber - 3)]
        } else if (collision.type == TOP) {
          return [collision.label, sanitize(labelNumber + 1), sanitize(labelNumber + 2)]
        } else if (collision.type == RIGHT) {
          return [collision.label, sanitize(labelNumber + 3)]
        } else if (collision.type == BOTTOM) {
          return [collision.label, sanitize(labelNumber + 1)]
        }
        return [collision.label];
      }
      else if (labelNumber % 3 == 2) {
        if (collision.type == TOP_LEFT) {
          return [collision.label, sanitize(labelNumber - 4), sanitize(labelNumber - 3), sanitize(labelNumber - 1)]
        } else if (collision.type == TOP_RIGHT) {
          return [collision.label, sanitize(labelNumber - 1), sanitize(labelNumber + 2), sanitize(labelNumber + 3)]
        } else if (collision.type == BOTTOM_LEFT) {
          return [collision.label, sanitize(labelNumber - 3), sanitize(labelNumber - 2), sanitize(labelNumber + 1)]
        } else if (collision.type == BOTTOM_RIGHT) {
          return [collision.label, sanitize(labelNumber + 1), sanitize(labelNumber + 3), sanitize(labelNumber + 4)]
        } else if (collision.type == LEFT) {
          return [collision.label, sanitize(labelNumber - 3)]
        } else if (collision.type == TOP) {
          return [collision.label, sanitize(labelNumber - 1)]
        } else if (collision.type == RIGHT) {
          return [collision.label, sanitize(labelNumber + 3)]
        } else if (collision.type == BOTTOM) {
          return [collision.label, sanitize(labelNumber + 1)]
        }
        return [collision.label];
      }
      else if (labelNumber % 3 == 0) {
        if (collision.type == TOP_LEFT) {
          return [collision.label, sanitize(labelNumber - 4), sanitize(labelNumber - 3), sanitize(labelNumber - 1)]
        } else if (collision.type == TOP_RIGHT) {
          return [collision.label, sanitize(labelNumber - 1), sanitize(labelNumber + 2), sanitize(labelNumber + 3)]
        } else if (collision.type == BOTTOM_LEFT) {
          return [collision.label, sanitize(labelNumber - 5), sanitize(labelNumber - 4), sanitize(labelNumber - 3),
          sanitize(labelNumber - 2), sanitize(labelNumber - 1)]
        } else if (collision.type == BOTTOM_RIGHT) {
          return [collision.label, sanitize(labelNumber - 2), sanitize(labelNumber - 1), sanitize(labelNumber + 1),
          sanitize(labelNumber + 2), sanitize(labelNumber + 3)]
        } else if (collision.type == LEFT) {
          return [collision.label, sanitize(labelNumber - 3)]
        } else if (collision.type == TOP) {
          return [collision.label, sanitize(labelNumber - 1)]
        } else if (collision.type == RIGHT) {
          return [collision.label, sanitize(labelNumber + 3)]
        } else if (collision.type == BOTTOM) {
          return [collision.label, sanitize(labelNumber - 1), sanitize(labelNumber - 2)]
        }
        return [collision.label];
      }
    }

    const range = (start: number, stop: number, step: number) =>
      Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => String(x + y * step))
    if (collision.label == "3rd")
      return range(1, 37, 3);
    if (collision.label == "2nd")
      return range(2, 37, 3);
    if (collision.label == "1st")
      return range(3, 37, 3);

    if (collision.label == "1-12")
      return range(1, 12 + 1, 1);
    if (collision.label == "13-24")
      return range(13, 24 + 1, 1);
    if (collision.label == "25-36")
      return range(25, 36 + 1, 1);

    if (collision.label == "1-18")
      return range(1, 18 + 1, 1);
    if (collision.label == "19-36")
      return range(19, 36 + 1, 1);

    if (collision.label == "even")
      return range(2, 36 + 1, 2);
    if (collision.label == "odd")
      return range(1, 36 + 1, 2);

    if (collision.label == "red")
      return BOX_COLOR_MAP.map((color, index) => color == RED ? String(index + 1) : null).filter((label) => label != null);
    if (collision.label == "black")
      return BOX_COLOR_MAP.map((color, index) => color == BLACK ? String(index + 1) : null).filter((label) => label != null);

    return []
  }
}

function isCollieded(x: number, y: number, width: number, height: number, screenContext: ScreenContext) {
  const mouseX = screenContext.events.mouse.x;
  const mouseY = screenContext.events.mouse.y;
  return (x <= mouseX && x + width > mouseX && y <= mouseY && y + height > mouseY)
}
export {
  Board, type CollisionResult, BOX_COLOR_MAP
};

