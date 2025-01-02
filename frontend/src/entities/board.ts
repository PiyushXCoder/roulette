import { ScreenContext } from "../components/game-screen/game-screen";
import { colors } from "./colors";
import { Drawable } from "./traits";


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

function drawLabledRect(context: CanvasRenderingContext2D, lable: string, x: number, y: number, width: number, height: number, lineWidth?: number, labelHeight?: number) {
  lineWidth = lineWidth || LINE_WIDTH;
  labelHeight = labelHeight || LABEL_HEIGHT;
  context.strokeStyle = colors.BLACK;
  context.lineWidth = LINE_WIDTH;
  context.strokeRect(x, y, width, height);
  context.fillStyle = colors.WHITE;
  context.font = "bold " + LABEL_HEIGHT + "px Sans";
  let lableWidth = context.measureText(lable).width;
  context.fillText(lable, x + (width - lableWidth) / 2, y + lineWidth / 2 + labelHeight / 4 + height / 2);
}

class Board implements Drawable {
  private static _instance: Board;

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
    drawLabledRect(context, "0", shiftX, shiftY, BOX_SIZE, 3 * BOX_SIZE);


    // Numbered Boxes
    localShiftX = shiftX + BOX_SIZE;
    localShiftY = shiftY;
    let col = 0, row = 0;
    BOX_COLOR_MAP.forEach((boxColor, index) => {
      context.fillStyle = boxColor;
      context.beginPath()
      context.arc(col * BOX_SIZE + BOX_SIZE / 2 + localShiftX, row * BOX_SIZE + BOX_SIZE / 2 + localShiftY, BOX_SIZE / 2 - LINE_WIDTH, 0, 2 * Math.PI);
      context.fill();
      drawLabledRect(context, String(index + 1), col * BOX_SIZE + localShiftX, row * BOX_SIZE + localShiftY, BOX_SIZE, BOX_SIZE);
      if ((index + 1) % 3 == 0) {
        row = 0; col += 1;
      } else row += 1;
    });

    // Row Selector
    localShiftX = shiftX + 13 * BOX_SIZE;
    localShiftY = shiftY;
    drawLabledRect(context, "3rd", localShiftX, localShiftY, BOX_SIZE, BOX_SIZE);
    drawLabledRect(context, "2nd", localShiftX, localShiftY + BOX_SIZE, BOX_SIZE, BOX_SIZE);
    drawLabledRect(context, "1st", localShiftX, localShiftY + 2 * BOX_SIZE, BOX_SIZE, BOX_SIZE);

    // Section Selector
    localShiftX = shiftX + BOX_SIZE;
    localShiftY = shiftY + 3 * BOX_SIZE;
    drawLabledRect(context, "1-12", localShiftX, localShiftY, BOX_SIZE * 4, BOX_SIZE);
    drawLabledRect(context, "13-24", localShiftX + BOX_SIZE * 4, localShiftY, BOX_SIZE * 4, BOX_SIZE);
    drawLabledRect(context, "25-36", localShiftX + BOX_SIZE * 4 * 2, localShiftY, BOX_SIZE * 4, BOX_SIZE);

    // Special Section Selector
    localShiftX = shiftX + BOX_SIZE;
    localShiftY = shiftY + 4 * BOX_SIZE;
    drawLabledRect(context, "1-18", localShiftX, localShiftY, BOX_SIZE * 2, BOX_SIZE);
    drawLabledRect(context, "even", localShiftX + BOX_SIZE * 2, localShiftY, BOX_SIZE * 2, BOX_SIZE);
    context.fillStyle = RED;
    context.fillRect(localShiftX + BOX_SIZE * 2 * 2 + LINE_WIDTH, localShiftY + LINE_WIDTH, BOX_SIZE * 2 - 2 * LINE_WIDTH, BOX_SIZE - 2 * LINE_WIDTH);
    drawLabledRect(context, "red", localShiftX + BOX_SIZE * 2 * 2, localShiftY, BOX_SIZE * 2, BOX_SIZE);
    context.fillStyle = BLACK;
    context.fillRect(localShiftX + BOX_SIZE * 2 * 3 + LINE_WIDTH, localShiftY + LINE_WIDTH, BOX_SIZE * 2 - 2 * LINE_WIDTH, BOX_SIZE - 2 * LINE_WIDTH);
    drawLabledRect(context, "black", localShiftX + BOX_SIZE * 2 * 3, localShiftY, BOX_SIZE * 2, BOX_SIZE);
    drawLabledRect(context, "odd", localShiftX + BOX_SIZE * 2 * 4, localShiftY, BOX_SIZE * 2, BOX_SIZE);
    drawLabledRect(context, "19-36", localShiftX + BOX_SIZE * 2 * 5, localShiftY, BOX_SIZE * 2, BOX_SIZE);

  }
}

export { Board };
