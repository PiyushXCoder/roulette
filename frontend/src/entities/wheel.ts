import { Drawable, Sensible } from "./traits";
import { ScreenContext } from "../components/game-screen/game-screen";
import { colors } from "./colors";
import { BOX_COLOR_MAP } from "./board";
import { gameState } from "./game-state";

const DIALOG_WIDTH = 450, DIALOG_HEIGHT = 550;
const WHEEL_RADIUS = 180;
const CENTER_RADIUS = 50;
const NUMBER_OF_OPTIONS = 37;
const WHEEL_FONT_HEIGHT = 13;
const NUMBER_ARRANGEMENT_ON_WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const BALL_RADIUS = 8;
const BALL_ORBIT_RADIUS = WHEEL_RADIUS - 20;

// Visual colors
const GOLD_ACCENT = "#D4AF37";
const DARK_WOOD = "#5D3A1A";
const METALLIC_DARK = "#505050";
const METALLIC_LIGHT = "#909090";

class Wheel implements Drawable, Sensible {
  private static _instance: Wheel;

  // Animation timing
  private spinStartTime: number = 0;
  private spinDuration: number = 4000;  // 4 seconds total spin
  private startAngle: number = 0;
  private totalRotation: number = 0;    // How much to rotate in total
  private targetAngle: number = 0;      // Final angle

  // Current wheel angle
  private wheelAngle: number = 0;

  // Ball segment

  // Animation state
  hidden: boolean = true;
  private isAnimating: boolean = false;
  private isStopped: boolean = false;

  private constructor() { }

  static instance() {
    if (Wheel._instance == undefined) {
      Wheel._instance = new Wheel();
    }
    return Wheel._instance;
  }

  draw(_deltaSeconds: number, context: CanvasRenderingContext2D, screenContext: ScreenContext) {
    if (this.hidden) return;

    const centerX = screenContext.screen.width / 2;
    const centerY = screenContext.screen.height / 2;
    const dialogX = (screenContext.screen.width - DIALOG_WIDTH) / 2;
    const dialogY = (screenContext.screen.height - DIALOG_HEIGHT) / 2;

    this.drawDialogBackground(context, dialogX, dialogY);
    this.drawWinInfo(context, dialogX, dialogY);
    this.updateAnimation();

    this.drawWheelRim(context, centerX, centerY + 30);
    this.drawWheel(context, centerX, centerY + 30, this.wheelAngle);
    this.drawWheelCenter(context, centerX, centerY + 30);

    this.drawPointer(context, centerX, centerY + 30);
  }

  private drawDialogBackground(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = "#28495b";
    ctx.beginPath();
    ctx.roundRect(x, y, DIALOG_WIDTH, DIALOG_HEIGHT, 20);
    ctx.fill();

    ctx.strokeStyle = GOLD_ACCENT;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 5, DIALOG_WIDTH - 10, DIALOG_HEIGHT - 10, 16);
    ctx.stroke();
  }

  private drawWinInfo(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const luckyNum = gameState.lastLuckyNumber ?? 0;
    const winAmount = gameState.lastWinningAmount;

    if (this.isStopped) {
      ctx.fillStyle = GOLD_ACCENT;
      ctx.font = "bold 18px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🎉 LUCKY NUMBER 🎉", x + DIALOG_WIDTH / 2, y + 32);

      const numColor = luckyNum === 0 ? colors.GREEN : BOX_COLOR_MAP[luckyNum - 1];

      ctx.beginPath();
      ctx.arc(x + DIALOG_WIDTH / 2, y + 70, 32, 0, Math.PI * 2);
      ctx.fillStyle = numColor;
      ctx.fill();
      ctx.strokeStyle = GOLD_ACCENT;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = colors.WHITE;
      ctx.font = "bold 32px Arial, sans-serif";
      ctx.fillText(String(luckyNum), x + DIALOG_WIDTH / 2, y + 82);

      if (winAmount > 0) {
        ctx.fillStyle = "#00ff88";
        ctx.font = "bold 28px Arial, sans-serif";
        ctx.fillText(`YOU WIN ₹${winAmount}!`, x + DIALOG_WIDTH / 2, y + DIALOG_HEIGHT - 20);
      } else {
        ctx.fillStyle = "#ff6666";
        ctx.font = "bold 22px Arial, sans-serif";
        ctx.fillText("Better luck next time!", x + DIALOG_WIDTH / 2, y + DIALOG_HEIGHT - 22);
      }

      ctx.fillStyle = "#888888";
      ctx.font = "14px Arial, sans-serif";
      ctx.fillText("Click anywhere to continue", x + DIALOG_WIDTH / 2, y + DIALOG_HEIGHT - 45);
    } else {
      ctx.fillStyle = GOLD_ACCENT;
      ctx.font = "bold 16px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SPINNING...", x + DIALOG_WIDTH / 2, y + 35);
    }

    ctx.textAlign = "left";
  }

  private updateAnimation() {
    if (!this.isAnimating) return;

    const elapsed = performance.now() - this.spinStartTime;
    const progress = Math.min(1, elapsed / this.spinDuration);

    // Smooth cubic ease-out: starts fast, slows down smoothly
    const eased = this.easeOutCubic(progress);

    // Interpolate from start to target
    this.wheelAngle = this.startAngle + this.totalRotation * eased;

    if (progress >= 1) {
      this.wheelAngle = this.targetAngle;
      this.isAnimating = false;
      this.isStopped = true;
      gameState.onWheelStopped();
    }
  }

  // Smooth ease-out cubic: 1 - (1-t)^3
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  startSpin(): void {
    this.hidden = false;
    this.isStopped = false;
    this.isAnimating = true;
    this.spinStartTime = performance.now();

    // Random starting angle
    this.startAngle = Math.random() * Math.PI * 2;
    this.wheelAngle = this.startAngle;

    // Calculate target angle for lucky number
    const luckyNumber = gameState.lastLuckyNumber ?? 0;
    const luckyIndex = NUMBER_ARRANGEMENT_ON_WHEEL.indexOf(luckyNumber);
    const stripAngle = (2 * Math.PI) / NUMBER_OF_OPTIONS;


    // Target: lucky segment at top (-PI/2)
    const segmentCenter = luckyIndex * stripAngle + stripAngle / 2;
    this.targetAngle = -Math.PI / 2 - segmentCenter;

    // Calculate total rotation: at least 3 full rotations + extra to reach target
    const minRotations = 3;
    let extraRotation = this.targetAngle - this.startAngle;

    // Normalize extra rotation to be positive (always spin forward)
    while (extraRotation < 0) extraRotation += Math.PI * 2;

    this.totalRotation = minRotations * Math.PI * 2 + extraRotation;

    gameState.isSpinning = true;
  }

  checkSensors(screenContext: ScreenContext): void {
    if (this.hidden) return;
    if (this.isStopped && screenContext.events.mouse.down) {
      this.hidden = true;
    }
  }

  private drawWheelRim(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.beginPath();
    ctx.arc(x, y, WHEEL_RADIUS + 8, 0, Math.PI * 2);
    ctx.lineWidth = 16;
    ctx.strokeStyle = METALLIC_DARK;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, WHEEL_RADIUS + 2, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = METALLIC_LIGHT;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, WHEEL_RADIUS - 1, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = GOLD_ACCENT;
    ctx.stroke();
  }

  drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, theta: number) {
    const stripAngle = (2 * Math.PI) / NUMBER_OF_OPTIONS;

    NUMBER_ARRANGEMENT_ON_WHEEL.forEach((number, index) => {
      const color = number === 0 ? colors.GREEN : BOX_COLOR_MAP[number - 1];
      const transform = ctx.getTransform();
      ctx.translate(x, y);
      ctx.rotate(theta + stripAngle * index);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, WHEEL_RADIUS, 0, stripAngle + 0.01);
      ctx.lineTo(0, 0);
      ctx.fill();

      ctx.strokeStyle = GOLD_ACCENT;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CENTER_RADIUS, 0);
      ctx.lineTo(WHEEL_RADIUS, 0);
      ctx.stroke();

      ctx.save();
      ctx.rotate(stripAngle / 2);
      ctx.fillStyle = colors.WHITE;
      ctx.font = `bold ${WHEEL_FONT_HEIGHT}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(number), WHEEL_RADIUS - 25, 0);
      ctx.restore();

      ctx.setTransform(transform);
    });
  }

  private drawWheelCenter(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.beginPath();
    ctx.arc(x, y, CENTER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = DARK_WOOD;
    ctx.fill();
    ctx.strokeStyle = GOLD_ACCENT;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fillStyle = GOLD_ACCENT;
    ctx.fill();
  }

  drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, theta: number) {
    const transform = ctx.getTransform();
    ctx.translate(x, y);
    ctx.rotate(theta);

    const ballX = BALL_ORBIT_RADIUS;
    const ballY = 0;

    ctx.beginPath();
    ctx.ellipse(ballX + 2, ballY + 2, BALL_RADIUS, BALL_RADIUS * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ballX - 2, ballY - 2, BALL_RADIUS * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fill();

    ctx.setTransform(transform);
  }

  private drawPointer(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const pointerY = y - WHEEL_RADIUS - 20;

    ctx.beginPath();
    ctx.moveTo(x, pointerY + 30);
    ctx.lineTo(x - 12, pointerY);
    ctx.lineTo(x + 12, pointerY);
    ctx.closePath();

    ctx.fillStyle = GOLD_ACCENT;
    ctx.fill();
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export { Wheel };
