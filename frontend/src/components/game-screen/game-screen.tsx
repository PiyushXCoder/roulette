import React, { useEffect, useRef } from "react";

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
      down: boolean,
      dragged: boolean
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
      down: false,
      dragged: false,
    }
  },
  screen: {
    width: 0,
    height: 0
  },
};

interface Config {
  width?: number,
  height?: number

  draw(deltaSeconds: number, context: CanvasRenderingContext2D, screenContext: ScreenContext): void
}

function GameScreen(args: Config) {
  const canvasRef: React.MutableRefObject<HTMLCanvasElement | null> = useRef(null);

  useEffect(() => {
    const canvas = getCanvas(canvasRef);
    if (canvas == null) return;
    const context = get2DContext(canvas);
    if (context == null) return;

    screenContext.screen.width = Number(canvas.style.width.replace(/[^0-9]/g, ""));
    screenContext.screen.height = Number(canvas.style.height.replace(/[^0-9]/g, ""));

    window.onmousemove = e => {
      screenContext.events.mouse.x = e.x - canvas.getBoundingClientRect().x;
      screenContext.events.mouse.y = e.y - canvas.getBoundingClientRect().y;
      if (screenContext.events.mouse.down) screenContext.events.mouse.dragged = true;
    }

    window.onmousedown = _ => {
      screenContext.events.mouse.down = true;
    }

    window.onmouseup = _ => {
      screenContext.events.mouse.down = false;
      screenContext.events.mouse.dragged = false;
    }

    let oldTimeStamp = 0;
    const handleDraw = (timestamp: number) => {
      let deltaSeconds = (timestamp - oldTimeStamp) / 1000;
      oldTimeStamp = timestamp;
      args.draw(deltaSeconds, context, screenContext);
      window.requestAnimationFrame(handleDraw);
    }

    window.requestAnimationFrame(handleDraw);

  }, [canvasRef]);

  return <canvas ref={canvasRef} style={{ imageRendering: "pixelated", width: args.width || 1000 + "px", height: args.height || 550 + "px" }} />
}

export { GameScreen, type ScreenContext };
