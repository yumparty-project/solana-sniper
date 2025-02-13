import { Connection, VersionedTransaction } from "@solana/web3.js";

/**
 * @helpers Transaction
 * Helper functions for Solana transaction handling
 *
 * Features:
 * - Transaction preparation
 * - Transaction signing
 * - Send and confirm transactions
 * - Error handling for failed transactions
 *
 * @requires @solana/web3.js
 */

/**
 * Prepares a transaction from swap data
 * @param swapData - Data from Jupiter API
 * @param signers - Array of signers for the transaction
 * @returns Prepared VersionedTransaction
 */
export const prepareTransaction = (
  swapData: any,
  signers: any[]
): VersionedTransaction => {
  const transactionBuf = Buffer.from(swapData.swapTransaction, "base64");
  const transaction = VersionedTransaction.deserialize(transactionBuf);
  transaction.sign(signers);
  return transaction;
};

/**
 * Sends and confirms a transaction
 * @param connection - Solana connection
 * @param transaction - Transaction to send
 * @returns Transaction signature
 * @throws Error if transaction fails
 */
export async function sendAndConfirmTransaction(
  connection: Connection,
  transaction: VersionedTransaction
): Promise<string> {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  const signature = await connection.sendTransaction(transaction);

  const confirmation = await connection.confirmTransaction(
    {
      signature,
      blockhash,
      lastValidBlockHeight,
    },
    "confirmed"
  ); // Use 'confirmed' instead of 'finalized' for faster confirmation

  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${confirmation.value.err}`);
  }

  return signature;
}
