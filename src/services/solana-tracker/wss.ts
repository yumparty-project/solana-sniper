import EventEmitter from "eventemitter3";

/**
 * Service handling WebSocket connections and message routing
 * Manages two separate WebSocket connections:
 * 1. Main socket for general updates
 * 2. Transaction socket for handling transaction-specific data
 */
export class WebSocketService {
  private wsUrl: string;
  private socket: WebSocket | null;
  private transactionSocket: WebSocket | null;
  private reconnectAttempts: number;
  private readonly reconnectDelay: number;
  private readonly reconnectDelayMax: number;
  private emitter: EventEmitter;
  private subscribedRooms: Set<string>;
  private transactions: Set<string>;
  private isConnecting: boolean;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  /**
   * Initializes the WebSocket service
   * @param wsUrl - WebSocket server URL to connect to
   */
  constructor(wsUrl: string) {
    this.wsUrl = wsUrl;
    this.socket = null;
    this.transactionSocket = null;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 2500;
    this.reconnectDelayMax = 4500;
    this.emitter = new EventEmitter();
    this.subscribedRooms = new Set();
    this.transactions = new Set();
    this.isConnecting = false;

    this.connect();

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.disconnect.bind(this));
    }
  }

  /**
   * Establishes connections to the WebSocket server
   * Creates both main and transaction sockets
   * @throws Error if connection fails after max attempts
   */
  async connect(): Promise<void> {
    if (
      this.isConnecting ||
      (this.socket?.readyState === WebSocket.OPEN &&
        this.transactionSocket?.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.isConnecting = true;

    try {
      await Promise.all([
        this.createSocket("main"),
        this.createSocket("transaction"),
      ]);
    } catch (e) {
      console.error("Error connecting to WebSocket:", e);
      this.isConnecting = false;
      this.reconnect();
    }
  }

  /**
   * Creates a new WebSocket connection
   * @param type - Socket type ('main' or 'transaction')
   * @returns Promise that resolves when connection is established
   */
  private createSocket(type: "main" | "transaction"): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.wsUrl);

      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error(`${type} connection timeout`));
      }, 5000);

      socket.onopen = () => {
        clearTimeout(timeout);
        if (type === "main") {
          this.socket = socket;
        } else {
          this.transactionSocket = socket;
        }
        this.setupSocketListeners(socket, type);
        resolve();
      };

      socket.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });
  }

  private setupSocketListeners(socket: WebSocket, type: string): void {
    socket.onopen = () => {
      console.log(`Connected to ${type} WebSocket server`);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.resubscribeToRooms();
    };

    socket.onclose = (event) => {
      console.log(
        `Disconnected from ${type} WebSocket server`,
        event.code,
        event.reason
      );
      if (type === "main") this.socket = null;
      if (type === "transaction") this.transactionSocket = null;
      this.isConnecting = false;

      if (event.code !== 1000) {
        this.reconnect();
      }
    };

    socket.onerror = (error) => {
      console.error(`WebSocket ${type} error:`, error);
      this.isConnecting = false;
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "message") {
          if (message.data?.tx && this.transactions.has(message.data.tx)) {
            return;
          } else if (message.data?.tx) {
            this.transactions.add(message.data.tx);
          }
          if (message.room.includes("price:")) {
            this.emitter.emit(
              `price-by-token:${message.data.token}`,
              message.data
            );
          }
          this.emitter.emit(message.room, message.data);
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    };
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close(1000, "Clean disconnect");
      this.socket = null;
    }
    if (this.transactionSocket) {
      this.transactionSocket.close(1000, "Clean disconnect");
      this.transactionSocket = null;
    }

    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.subscribedRooms.clear();
    this.transactions.clear();
  }

  private reconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts),
      this.reconnectDelayMax
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Joins a specific room to receive updates
   * @param room - Room name to join
   */
  joinRoom(room: string): void {
    this.subscribedRooms.add(room);
    const socket = room.includes("transaction")
      ? this.transactionSocket
      : this.socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "join", room }));
    }
  }

  /**
   * Leaves a specific room to stop receiving updates
   * @param room - Room name to leave
   */
  leaveRoom(room: string): void {
    this.subscribedRooms.delete(room);
    const socket = room.includes("transaction")
      ? this.transactionSocket
      : this.socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "leave", room }));
    }
  }

  /**
   * Subscribes to events from a specific room
   * @param room - Room name to listen to
   * @param listener - Callback function for handling events
   */
  on(room: string, listener: (data: any) => void): void {
    this.emitter.on(room, listener);
  }

  /**
   * Unsubscribes from events of a specific room
   * @param room - Room name to stop listening to
   * @param listener - Callback function to remove
   */
  off(room: string, listener: (data: any) => void): void {
    this.emitter.off(room, listener);
  }

  /**
   * Returns the main WebSocket instance
   * @returns The main WebSocket connection or null if not connected
   */
  getSocket(): WebSocket | null {
    return this.socket;
  }

  private resubscribeToRooms(): void {
    if (
      this.socket &&
      this.socket.readyState === WebSocket.OPEN &&
      this.transactionSocket &&
      this.transactionSocket.readyState === WebSocket.OPEN
    ) {
      for (const room of this.subscribedRooms) {
        const socket = room.includes("transaction")
          ? this.transactionSocket
          : this.socket;
        socket.send(JSON.stringify({ type: "join", room }));
      }
    }
  }
}
