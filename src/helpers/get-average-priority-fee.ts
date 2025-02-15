import { Connection } from "@solana/web3.js";
import { CONFIG } from "../config";

/**
 * Retrieves the average priority fee from the Solana RPC
 * @returns Average priority fee in micro-lamports and SOL amount
 */
export async function getAveragePriorityFee() {
  const connection = new Connection(CONFIG.SOLANA_RPC);
  const priorityFees = await connection.getRecentPrioritizationFees();
  if (priorityFees.length === 0) {
    return { microLamports: 10000, solAmount: 0.00001 }; // Default to 10000 micro-lamports if no data
  }

  const recentFees = priorityFees.slice(-150); // Get fees from last 150 slots
  const averageFee =
    recentFees.reduce((sum, fee) => sum + fee.prioritizationFee, 0) /
    recentFees.length;
  const microLamports = Math.ceil(averageFee);
  const solAmount = microLamports / 1e6 / 1e3; // Convert micro-lamports to SOL
  return { microLamports, solAmount };
}
