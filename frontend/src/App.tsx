import { GameScreen, ScreenContext } from "./components/game-screen/game-screen.tsx"
import "./App.css";
import { colors } from "./entities/colors.ts";
import { Board } from "./entities/board.ts";
import { Chip } from "./entities/chip.ts";
import { Wallet } from "./entities/wallet.ts";
import { Wheel } from "./entities/wheel.ts";
import { StatusMessage } from "./entities/status_message.ts";
import { Button } from "./entities/button.ts";
import { wsManager } from "./websocket.ts";
import { gameState } from "./entities/game-state.ts";
import type { ResponseMessage } from "./types/messages.ts";
import { useEffect, useState } from "react";

function draw(deltaSeconds: number, context: CanvasRenderingContext2D, screenContext: ScreenContext) {
  context.fillStyle = colors.BOARD;
  context.fillRect(0, 0, screenContext.screen.width, screenContext.screen.height);

  const wheel = Wheel.instance();
  const board = Board.instance();
  const chipOne = Chip.instance(1);
  const chipTen = Chip.instance(10);
  const chipHundered = Chip.instance(100);
  const chipFiveHundered = Chip.instance(500);
  const wallet = Wallet.instance();
  const statusMessage = StatusMessage.instance();
  const spinButton = Button.instance("spin_button");

  if (wheel.hidden) board.checkSensors(screenContext);
  board.draw(deltaSeconds, context, screenContext);

  chipOne?.setColor(colors.GREEN);
  chipOne?.setAddButtonPosition(0);
  if (wheel.hidden) chipOne?.checkSensors(screenContext);
  chipOne?.draw(deltaSeconds, context, screenContext);

  chipTen?.setColor(colors.YELLOW);
  chipTen?.setAddButtonPosition(1);
  if (wheel.hidden) chipTen?.checkSensors(screenContext);
  chipTen?.draw(deltaSeconds, context, screenContext);

  chipHundered?.setColor(colors.TEAL);
  chipHundered?.setAddButtonPosition(2);
  if (wheel.hidden) chipHundered?.checkSensors(screenContext);
  chipHundered?.draw(deltaSeconds, context, screenContext);

  chipFiveHundered?.setColor(colors.BLUE);
  chipFiveHundered?.setAddButtonPosition(3);
  if (wheel.hidden) chipFiveHundered?.checkSensors(screenContext);
  chipFiveHundered?.draw(deltaSeconds, context, screenContext);

  wallet.draw(deltaSeconds, context, screenContext);

  statusMessage.draw(deltaSeconds, context, screenContext);

  // Draw spin button BEFORE wheel so wheel appears on top
  spinButton?.setLabel("Spin!");
  spinButton?.setPosition((screenContext.screen.width - spinButton.width) / 2, screenContext.screen.height - 100);
  spinButton?.setEventListener(() => {
    console.log("Spin button clicked - requesting spin");
    wsManager.sendRequestSpin();
  });
  if (wheel.hidden) spinButton?.checkSensors(screenContext);
  spinButton?.draw(deltaSeconds, context, screenContext);

  // Wheel is drawn last so it appears on top
  wheel.checkSensors(screenContext);
  wheel.draw(deltaSeconds, context, screenContext);
}

export { GameScreen };

function App() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Track if this effect was aborted (React StrictMode unmount)
    let aborted = false;

    // Get WebSocket URL from environment or use default
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/game_ws';
    const tableId = import.meta.env.VITE_DEFAULT_TABLE || 'main-table';

    // Get or prompt for player name (use sessionStorage to avoid double prompt in StrictMode)
    let playerName = sessionStorage.getItem('roulette_player_name');
    if (!playerName) {
      playerName = prompt("Enter your name:") || `Player_${Math.floor(Math.random() * 1000)}`;
      sessionStorage.setItem('roulette_player_name', playerName);
    }

    // Connect to WebSocket
    wsManager.connect(wsUrl, tableId, playerName)
      .then((playerId) => {
        if (aborted) {
          console.log("Connection succeeded but effect was aborted, ignoring");
          return;
        }
        console.log("Connected with player ID:", playerId);
        setError(null); // Clear any previous error
        setConnected(true);

        // Request initial status
        wsManager.sendGetStatus();
      })
      .catch((err) => {
        if (aborted) {
          console.log("Connection failed but effect was aborted, ignoring");
          return;
        }
        console.error("Failed to connect:", err);
        const errorMessage = err instanceof Error ? err.message :
          err instanceof Event ? 'Connection failed' : String(err);
        setError(`Failed to connect: ${errorMessage}`);
      });

    // Set up message handlers
    const handleMessage = (message: ResponseMessage) => {
      if ("Status" in message) {
        gameState.updateFromStatus(message.Status.status);
      } else if ("AddBet" in message) {
        gameState.addBet(message);
      } else if ("ClearBets" in message) {
        gameState.clearBets();
        Chip.clearAllBets();
      } else if ("Spin" in message) {
        gameState.handleSpin(message);
        Wheel.instance().startSpin();
      } else if ("BeginSpinTimmer" in message) {
        gameState.beginSpinTimer(message.BeginSpinTimmer.start);
      } else if ("SomePlayerJoined" in message) {
        gameState.addPlayer({
          name: message.SomePlayerJoined.name,
          id_hash: message.SomePlayerJoined.hash_id,
          bet_amount: message.SomePlayerJoined.bet_amount
        });
      } else if ("SomePlayerLeft" in message) {
        gameState.removePlayer(message.SomePlayerLeft.hash_id);
      } else if ("ListPlayers" in message) {
        gameState.updatePlayers(message.ListPlayers.players);
      } else if ("Error" in message) {
        console.error("Server error:", message.Error.msg);
        alert(`Error: ${message.Error.msg}`);
      }
    };

    wsManager.onMessage(handleMessage);

    // Cleanup on unmount
    return () => {
      aborted = true; // Signal that this effect was aborted
      wsManager.removeMessageHandler(handleMessage);
      wsManager.disconnect();
    };
  }, []);

  if (error) {
    return (
      <div style={{ color: 'white', padding: '20px' }}>
        <h2>Connection Error</h2>
        <p>{error}</p>
        <p>Make sure the backend server is running on localhost:8000</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div style={{ color: 'white', padding: '20px' }}>
        <h2>Connecting to game server...</h2>
      </div>
    );
  }

  return (
    <GameScreen draw={draw} />
  )
}

export default App
