import { WebSocketService } from "./wss";

/**
 * API client for tracking Solana blockchain data through WebSocket connections.
 * Implements the Singleton pattern to ensure only one instance is created.
 */
export class SolanaTrackerAPI {
  private wsService: WebSocketService;
  private static instance: SolanaTrackerAPI;

  private constructor(wsUrl: string) {
    this.wsService = new WebSocketService(wsUrl);
  }

  /**
   * Creates a singleton instance of the SolanaTrackerAPI
   * @param wsUrl - WebSocket server URL to connect to
   * @returns The singleton instance of SolanaTrackerAPI
   */
  public static getInstance(wsUrl: string): SolanaTrackerAPI {
    if (!SolanaTrackerAPI.instance) {
      SolanaTrackerAPI.instance = new SolanaTrackerAPI(wsUrl);
    }
    return SolanaTrackerAPI.instance;
  }

  /**
   * Subscribes to latest token and pool updates
   * @param callback - Function to handle incoming data
   */
  public subscribeToLatest(callback: (data: any) => void): void {
    this.wsService.joinRoom("latest");
    this.wsService.on("latest", callback);
  }

  /**
   * Subscribes to updates for a specific liquidity pool
   * @param poolId - The unique identifier of the pool to track
   * @param callback - Function to handle incoming pool data
   */
  public subscribeToPool(poolId: string, callback: (data: any) => void): void {
    const room = `pool:${poolId}`;
    this.wsService.joinRoom(room);
    this.wsService.on(room, callback);
  }

  /**
   * Subscribes to transactions for a specific token/pool pair
   * @param tokenAddress - The token's contract address
   * @param poolId - The pool's unique identifier
   * @param callback - Function to handle incoming transaction data
   */
  public subscribeToTokenPoolTransactions(
    tokenAddress: string,
    poolId: string,
    callback: (data: any) => void
  ): void {
    const room = `transaction:${tokenAddress}:${poolId}`;
    this.wsService.joinRoom(room);
    this.wsService.on(room, callback);
  }

  /**
   * Subscribes to price updates for a specific token
   * @param tokenId - The token's unique identifier
   * @param callback - Function to handle incoming price data
   */
  public subscribeToTokenPrice(
    tokenId: string,
    callback: (data: any) => void
  ): void {
    const room = `price-by-token:${tokenId}`;
    this.wsService.joinRoom(room);
    this.wsService.on(room, callback);
  }

  /**
   * Subscribes to transactions for a specific wallet address
   * @param walletAddress - The Solana wallet address to track
   * @param callback - Function to handle incoming transaction data
   */
  public subscribeToWalletTransactions(
    walletAddress: string,
    callback: (data: any) => void
  ): void {
    const room = `wallet:${walletAddress}`;
    this.wsService.joinRoom(room);
    this.wsService.on(room, callback);
  }

  /**
   * Unsubscribes from a specific room/event
   * @param room - The room name to unsubscribe from
   * @param callback - The callback function to remove
   */
  public unsubscribe(room: string, callback: (data: any) => void): void {
    this.wsService.leaveRoom(room);
    this.wsService.off(room, callback);
  }

  /**
   * Disconnects from the WebSocket server and cleans up resources
   */
  public disconnect(): void {
    this.wsService.disconnect();
  }
}
