import React, { useEffect, useRef } from "react";

// const RED = "#b44744", BLACK = "#212322";
// type BoxType = typeof RED | typeof BLACK;

// const ColouredBoxMap: BoxType[] = [
//   RED, BLACK, RED,
//   BLACK, RED, BLACK,
//   RED, BLACK, RED,
//   BLACK, BLACK, RED,
//   BLACK, RED, BLACK,
//   RED, BLACK, RED,
//   RED, BLACK, RED,
//   BLACK, RED, BLACK,
//   RED, BLACK, RED,
//   BLACK, BLACK, RED,
//   BLACK, RED, BLACK,
//   RED, BLACK, RED,
// ]


function getCanvas(canvasRef: React.MutableRefObject<HTMLCanvasElement | null>) {
  const canvas: HTMLCanvasElement | null = canvasRef.current;
  if (canvas == null) return null;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  return canvas;
}

function get2DContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  context?.scale(dpr, dpr);
  return context;
}

interface ScreenContext {
  events: {
    mouse: {
      x: number,
      y: number
      down: boolean
    }
  },
  screen: {
    width: number,
    height: number,
  }
}

let screenContext: ScreenContext = {
  events: {
    mouse: {
      x: 0,
      y: 0,
      down: false
    }
  },
  screen: {
    width: 0,
    height: 0
  }
};

interface Config {
  width?: number,
  height?: number
}

function GameScreen(args: Config) {
  const canvasRef: React.MutableRefObject<HTMLCanvasElement | null> = useRef(null);

  useEffect(() => {
    const canvas = getCanvas(canvasRef);
    if (canvas == null) return;
    const context = get2DContext(canvas);
    if (context == null) return;

    screenContext.screen.width = canvas.width;
    screenContext.screen.height = canvas.height;

    window.onmousemove = e => {
      screenContext.events.mouse.x = e.x - canvas.getBoundingClientRect().x;
      screenContext.events.mouse.y = e.y - canvas.getBoundingClientRect().y;
    }

    window.onmousedown = _ => {
      screenContext.events.mouse.down = true;
    }

    window.onmouseup = _ => {
      screenContext.events.mouse.down = false;
    }

    let oldTimeStamp = 0;
    const handleDraw = (timestamp: number) => {
      let deltaSeconds = (timestamp - oldTimeStamp) / 1000;
      oldTimeStamp = timestamp;
      draw(deltaSeconds, context, screenContext);
      window.requestAnimationFrame(handleDraw);
    }

    window.requestAnimationFrame(handleDraw);

  }, [canvasRef]);

  return <canvas ref={canvasRef} style={{ border: "green 2px solid", imageRendering: "pixelated", width: args.width || 1000 + "px", height: args.height || 500 + "px" }} />
}

function draw(deltaSeconds: number, context: CanvasRenderingContext2D, screenContext: ScreenContext) {
  console.log(deltaSeconds);
  context.clearRect(0, 0, 1000 + 4, 500 + 4);
  context.fillStyle = "#f00";

  if (screenContext.events.mouse.down) {
    context.fillRect(0, 0, 100, 100);
  }

  context.fillRect(screenContext.events.mouse.x - 8, screenContext.events.mouse.y - 8, 16, 16);
}

export { GameScreen };
