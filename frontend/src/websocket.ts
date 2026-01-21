import type { RequestMessage, ResponseMessage, Placement } from "./types/messages";

type MessageHandler = (message: ResponseMessage) => void;

class WebSocketManager {
    private ws: WebSocket | null = null;
    private playerId: string | null = null;
    private messageHandlers: MessageHandler[] = [];
    private reconnectTimer: number | null = null;
    private shouldReconnect: boolean = true;

    connect(url: string, tableId: string, playerName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(url);

                this.ws.onopen = () => {
                    console.log("WebSocket connected");
                    // Send JoinTable request
                    this.send({
                        JoinTable: {
                            table_id: tableId,
                            player_id: this.playerId || undefined,
                            name: playerName,
                        },
                    });

                    // Set up one-time listener for JoinTable response
                    const joinHandler = (message: ResponseMessage) => {
                        if ("JoinTable" in message) {
                            this.playerId = message.JoinTable.player_id;
                            console.log("Joined table with player_id:", this.playerId);
                            resolve(this.playerId);
                        }
                    };
                    this.onMessage(joinHandler);

                    // Timeout after 5 seconds
                    setTimeout(() => {
                        if (!this.playerId) {
                            reject(new Error("Failed to join table: timeout"));
                        }
                    }, 5000);
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: ResponseMessage = JSON.parse(event.data);
                        console.log("Received message:", message);
                        this.messageHandlers.forEach((handler) => handler(message));
                    } catch (error) {
                        console.error("Failed to parse message:", error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error("WebSocket error:", error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log("WebSocket closed");
                    if (this.shouldReconnect && this.reconnectTimer === null) {
                        this.reconnectTimer = window.setTimeout(() => {
                            console.log("Attempting to reconnect...");
                            if (this.playerId) {
                                this.connect(url, tableId, playerName);
                            }
                            this.reconnectTimer = null;
                        }, 3000);
                    }
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    send(message: RequestMessage): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error("WebSocket is not connected");
            return;
        }

        try {
            const json = JSON.stringify(message);
            console.log("Sending message:", json);
            this.ws.send(json);
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    }

    onMessage(handler: MessageHandler): void {
        this.messageHandlers.push(handler);
    }

    removeMessageHandler(handler: MessageHandler): void {
        const index = this.messageHandlers.indexOf(handler);
        if (index > -1) {
            this.messageHandlers.splice(index, 1);
        }
    }

    disconnect(): void {
        this.shouldReconnect = false;
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.playerId = null;
    }

    // Convenience methods for specific message types
    sendAddBet(label: string, placement: Placement, localPosition: [number, number], amount: number): void {
        this.send({
            AddBet: {
                label,
                placement,
                // Convert to integers - backend expects i32
                local_position: [Math.round(localPosition[0]), Math.round(localPosition[1])],
                amount,
            },
        });
    }

    sendClearBets(): void {
        this.send("ClearBets");
    }

    sendRequestSpin(): void {
        this.send("RequestSpin");
    }

    sendGetStatus(): void {
        this.send("GetStatus");
    }

    sendListPlayers(): void {
        this.send("ListPlayers");
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    getPlayerId(): string | null {
        return this.playerId;
    }
}

// Singleton instance
export const wsManager = new WebSocketManager();
