import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { CONFIG } from "../../config";
import { createVersionedTransaction } from "../../helpers/create-versioned-transaction";
import { deserializeInstruction } from "../../helpers/deserialize-instruction";
import { getAddressLookupTableAccounts } from "../../helpers/get-address-lookup-table-accounts";
import { getAveragePriorityFee } from "../../helpers/get-average-priority-fee";
import { getTokenInfo } from "../../helpers/get-token-info";
import { simulateTransaction } from "../../helpers/simulate-transaction";
import { getQuote } from "../jupiter/get-quote";
import { getSwapInstructions } from "../jupiter/get-swap-instructions";
import { checkBundleWithTimeout } from "./check-bundle-status";
import { createJitoBundle } from "./create-jito-bundle";
import { sendJitoBundle } from "./send-jito-bundle";

const connection = new Connection(CONFIG.SOLANA_RPC);

/**
 * Swaps tokens using Jupiter API
 * @param inputMint - Input mint address
 * @param outputMint - Output mint address
 * @param amount - Amount to swap
 * @param slippageBps - Slippage percentage
 * @param maxRetries - Maximum number of retries
 * @param wallet - Wallet to use for the swap
 * @returns Bundle status and signature
 */
export async function swap(
  inputMint: any,
  outputMint: any,
  amount: any,
  slippageBps = 100,
  maxRetries = 5,
  wallet: Keypair
) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      console.log("\n🔄 ========== INITIATING SWAP ==========");
      console.log("🔍 Fetching token information...");
      const inputTokenInfo = await getTokenInfo(inputMint);
      const outputTokenInfo = await getTokenInfo(outputMint);

      console.log(`🔢 Input token decimals: ${inputTokenInfo.decimals}`);
      console.log(`🔢 Output token decimals: ${outputTokenInfo.decimals}`);

      const adjustedAmount = amount * Math.pow(10, inputTokenInfo.decimals);
      const adjustedSlippageBps = slippageBps * (1 + retries * 0.5);

      // 1. Get quote from Jupiter
      console.log("\nGetting quote from Jupiter...");
      const quoteResponse = await getQuote(
        inputMint,
        outputMint,
        adjustedAmount,
        adjustedSlippageBps
      );

      if (!quoteResponse || !quoteResponse.routePlan) {
        throw new Error("No trading routes found");
      }

      console.log("Quote received successfully");

      // 2. Get swap instructions
      console.log("\nGetting swap instructions...");
      const swapInstructions = await getSwapInstructions(
        quoteResponse,
        wallet.publicKey.toString()
      );

      if (!swapInstructions || swapInstructions.error) {
        throw new Error(
          "Failed to get swap instructions: " +
            (swapInstructions ? swapInstructions.error : "Unknown error")
        );
      }

      console.log("Swap instructions received successfully");

      const {
        setupInstructions,
        swapInstruction: swapInstructionPayload,
        cleanupInstruction,
        addressLookupTableAddresses,
      } = swapInstructions;

      const swapInstruction = deserializeInstruction(swapInstructionPayload);

      // 3. Prepare transaction
      console.log("\nPreparing transaction...");
      const addressLookupTableAccounts = await getAddressLookupTableAccounts(
        addressLookupTableAddresses
      );

      const latestBlockhash = await connection.getLatestBlockhash("finalized");

      // 4. Simulate transaction to get compute units
      const instructions = [
        ...setupInstructions.map(deserializeInstruction),
        swapInstruction,
      ];

      if (cleanupInstruction) {
        instructions.push(deserializeInstruction(cleanupInstruction));
      }

      console.log("\nSimulating transaction...");
      const computeUnits = await simulateTransaction(
        instructions,
        wallet.publicKey,
        addressLookupTableAccounts,
        5
      );

      if (computeUnits === undefined) {
        throw new Error("Failed to simulate transaction");
      }

      if (
        typeof computeUnits === "object" &&
        "error" in computeUnits &&
        computeUnits.error === "InsufficientFundsForRent"
      ) {
        console.log("Insufficient funds for rent. Skipping this swap.");
        return null;
      }

      const priorityFee = await getAveragePriorityFee();

      console.log(`Compute units: ${computeUnits}`);
      console.log(
        `Priority fee: ${
          priorityFee.microLamports
        } micro-lamports (${priorityFee.solAmount.toFixed(9)} SOL)`
      );

      // 5. Create versioned transaction
      const transaction = createVersionedTransaction(
        instructions,
        wallet.publicKey,
        addressLookupTableAccounts,
        latestBlockhash.blockhash,
        computeUnits,
        priorityFee
      );

      // 6. Sign the transaction
      transaction.sign([wallet]);

      // 7. Create and send Jito bundle
      console.log("\nCreating Jito bundle...");
      const jitoBundle = await createJitoBundle(transaction, wallet);
      console.log("Jito bundle created successfully");

      console.log("\nSending Jito bundle...");
      let bundleId = await sendJitoBundle(jitoBundle);
      console.log(`Jito bundle sent. Bundle ID: ${bundleId}`);

      console.log("\nChecking bundle status...");
      const bundleResult = await checkBundleWithTimeout(bundleId);
      console.log({ bundleResult });
      if (bundleResult.success) {
        console.log(
          `Bundle finalized. Slot: ${bundleResult.status?.landedSlot}`
        );
        console.log("Swap executed successfully!");
        console.log("========== SWAP COMPLETE ==========\n");

        const signature = bs58.encode(transaction.signatures[0]);
        return { bundleStatus: bundleResult.status, signature };
      }

      // 8. If bundle failed or timeout, increase priority fee and retry
      const newPriorityFee = {
        microLamports: priorityFee.microLamports + 1000 * (retries + 1),
        solAmount: (priorityFee.microLamports + 1000 * (retries + 1)) / 1e6,
      };

      console.log(
        `⚠️ Bundle failed/timeout. Increasing priority fee to ${newPriorityFee.microLamports} microLamports`
      );
      throw new Error(bundleResult.error || "Bundle execution failed");
    } catch (error) {
      console.error(
        `\nError executing swap (attempt ${retries + 1}/${maxRetries}):`
      );
      console.error((error as any).message);
      retries++;
      if (retries >= maxRetries) {
        console.error(`\nFailed to execute swap after ${maxRetries} attempts.`);
        throw error;
      }
      console.log(`\nRetrying in 2 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
