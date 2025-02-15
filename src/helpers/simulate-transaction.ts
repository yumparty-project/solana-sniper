import {
  Connection,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { CONFIG } from "../config";

/**
 * Simulates a transaction to estimate compute units
 * @param instructions - Array of instructions to include in the transaction
 * @param payer - Payer of the transaction
 * @param addressLookupTableAccounts - Address lookup table accounts
 * @param maxRetries - Maximum number of retries
 */
export async function simulateTransaction(
  instructions: any,
  payer: any,
  addressLookupTableAccounts: any,
  maxRetries = 5
) {
  console.log("🔍 Simulating transaction to estimate compute units...");
  const connection = new Connection(CONFIG.SOLANA_RPC);
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");

  let retries = 0;
  while (retries < maxRetries) {
    try {
      const messageV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: instructions.filter(Boolean),
      }).compileToV0Message(addressLookupTableAccounts);

      const transaction = new VersionedTransaction(messageV0);

      const simulation = await connection.simulateTransaction(transaction, {
        sigVerify: false,
        replaceRecentBlockhash: true,
      });

      if (simulation.value.err) {
        console.error(
          "❌ Simulation error:",
          JSON.stringify(simulation.value.err, null, 2)
        );
        if (simulation.value.logs) {
          console.error("📜 Simulation logs:", simulation.value.logs);
        }
        throw new Error(
          `❌ Simulation failed: ${JSON.stringify(simulation.value.err)}`
        );
      }

      const unitsConsumed = simulation.value.unitsConsumed || 0;
      console.log("✅ Simulation successful. Units consumed:", unitsConsumed);

      const computeUnits = Math.ceil(unitsConsumed * 1.2);
      return computeUnits;
    } catch (error: any) {
      console.error("❌ Error during simulation:", error.message);
      if (error.message.includes("InsufficientFundsForRent")) {
        return { error: "InsufficientFundsForRent" };
      }
      retries++;
      if (retries >= maxRetries) {
        console.error("❌ Max retries reached. Simulation failed.");
        return undefined;
      }
      console.log(`🔄 Retrying simulation (attempt ${retries + 1})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
