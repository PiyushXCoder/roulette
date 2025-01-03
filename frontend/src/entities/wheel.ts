import { Drawable, Sensible } from "./traits";
import { ScreenContext } from "../components/game-screen/game-screen";
import { colors } from "./colors";
import { BOX_COLOR_MAP } from "./board";

const DIALOG_WIDTH = 400, DIALOG_HEIGHT = 500;
const WHEEL_RADIUS = 170;
const NUMBER_OF_OPTIONS = 37;
const WHEEL_FONT_HEIGHT = 14;
const WHEEL_TEXT_SPACING = 18;
const NUMBER_ARRANGEMENT_ON_WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]
const BALL_RADIUS = 7;

class Wheel implements Drawable, Sensible {
  private static _instance: Wheel;
  betAmount: number = 0
  holdingAmount: number = 0
  wheelAngularVelocity: number = 1
  wheelAngularAccleration: number = -0.03
  wheelAngularDisplacement: number = 0
  ballAngularDisplacement: number = 0
  ballAngularVelocity: number = -0.3;
  luckyNumber: number = 11
  hidden: boolean = true;

  private constructor() { }

  static instance() {
    if (Wheel._instance == undefined) {
      Wheel._instance = new Wheel();
    }

    return Wheel._instance;
  }

  draw(_deltaSeconds: number, context: CanvasRenderingContext2D, _screenContext: ScreenContext) {
    if (this.hidden) return;
    let localShiftX = (_screenContext.screen.width - DIALOG_WIDTH) / 2, localShiftY = (_screenContext.screen.height - DIALOG_HEIGHT) / 2;
    context.fillStyle = colors.BLUE;
    context.fillRect(localShiftX, localShiftY, DIALOG_WIDTH, DIALOG_HEIGHT);

    localShiftX = (_screenContext.screen.width) / 2, localShiftY = (_screenContext.screen.height) / 2;

    if (this.wheelAngularVelocity > 0) {
      this.wheelAngularDisplacement += this.wheelAngularVelocity * _deltaSeconds +
        (1 / 2) * this.wheelAngularAccleration * (_deltaSeconds * _deltaSeconds)
      this.wheelAngularVelocity = this.wheelAngularVelocity + this.wheelAngularAccleration * _deltaSeconds;
    } else { this.wheelAngularVelocity = 0; }

    this.drawWheel(context, localShiftX, localShiftY, this.wheelAngularDisplacement);

    const stripAngle = (2 * Math.PI) / NUMBER_OF_OPTIONS;
    if (this.wheelAngularVelocity == 0) {
      const neededDisplacement = (this.wheelAngularDisplacement + stripAngle * NUMBER_ARRANGEMENT_ON_WHEEL.indexOf(this.luckyNumber)) % (2 * Math.PI)
      const currentDisplacement = (2 * Math.PI) + (this.ballAngularDisplacement % (2 * Math.PI))
      if (Math.abs(neededDisplacement - currentDisplacement) < 0.1)
        this.ballAngularVelocity = 0;
    }
    this.ballAngularDisplacement += this.ballAngularVelocity * _deltaSeconds;
    this.drawBall(context, localShiftX, localShiftY, this.ballAngularDisplacement);
  }

  checkSensors(screenContext: ScreenContext): void {
    if (this.hidden) return;
    if (this.ballAngularVelocity == 0 && screenContext.events.mouse.down) {
      this.hidden = true;
    }
  }

  drawWheel(context: CanvasRenderingContext2D, x: number, y: number, theta: number) {
    const stripAngle = (2 * Math.PI) / NUMBER_OF_OPTIONS;
    NUMBER_ARRANGEMENT_ON_WHEEL.forEach((number, index) => {
      const color = number == 0 ? colors.GREEN : BOX_COLOR_MAP[number - 1]
      const transform = context.getTransform();
      context.translate(x, y);
      context.rotate(theta + stripAngle * index);

      context.fillStyle = color;
      context.beginPath();
      context.moveTo(0, 0);
      context.arc(0, 0, WHEEL_RADIUS, 0, stripAngle);
      context.lineTo(0, 0);
      context.fill();

      context.strokeStyle = colors.WHITE;
      context.setLineDash([]);
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(WHEEL_RADIUS / 2, 0);
      context.arc(0, 0, WHEEL_RADIUS, 0, stripAngle);
      context.stroke();

      context.fillStyle = colors.BROWN;
      context.beginPath();
      context.arc(0, 0, 2 * WHEEL_RADIUS / 3, 0, 2 * Math.PI);
      context.fill();

      context.fillStyle = colors.WHITE;
      context.font = WHEEL_FONT_HEIGHT + "pt Sans";
      const label = String(number);
      const labelWidth = context.measureText(label).width;
      context.fillText(label, WHEEL_RADIUS - labelWidth - 5, WHEEL_TEXT_SPACING);

      context.setTransform(transform);
    });
  }

  drawBall(context: CanvasRenderingContext2D, x: number, y: number, theta: number) {
    const transform = context.getTransform();
    context.translate(x, y);
    context.rotate(theta);

    context.fillStyle = colors.WHITE;
    context.beginPath();
    context.arc(WHEEL_RADIUS - 10, 0, BALL_RADIUS, 0, 2 * Math.PI);
    context.fill();

    context.setTransform(transform);
  }
}

export { Wheel };
