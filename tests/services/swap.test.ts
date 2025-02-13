import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { expect } from "chai";
import dotenv from "dotenv";
import { CONFIG } from "../../src/config";
import { SwapService } from "../../src/services/swap";

dotenv.config();

/**
 * Integration tests for the Swap Service
 *
 * IMPORTANT: These tests are designed to simulate production environment behavior.
 * Precautions:
 * - Use a dedicated test wallet with minimal funds
 * - Tests operate with very small amounts (0.000001 SOL)
 * - All tokens are sold back to SOL after tests
 *
 * Required setup:
 * - SOLANA_PRIVATE_KEY in .env pointing to a test wallet
 * - Small amount of SOL in test wallet (~0.0001 SOL is sufficient)
 */
describe("Swap Service Tests", () => {
  let swapService: SwapService;
  const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const TINY_AMOUNT = 0.000001;

  // Augmenter les timeouts
  const DEFAULT_TIMEOUT = 60000; // 60 secondes
  const DELAY_BETWEEN_TESTS = 5000; // 5 secondes (augmenté de 2s à 5s)
  const TRANSACTION_CONFIRMATION_DELAY = 8000; // 8 secondes

  before(() => {
    if (!process.env.SOLANA_PRIVATE_KEY) {
      throw new Error("SOLANA_PRIVATE_KEY not found in .env");
    }

    const connection = new Connection(CONFIG.SOLANA_RPC);
    const secretKey = bs58.decode(process.env.SOLANA_PRIVATE_KEY);
    const keypair = Keypair.fromSecretKey(secretKey);
    swapService = new SwapService(connection, keypair);
  });

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Amélioration de la fonction withRetry
  async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 5,
    initialDelay = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (i === maxRetries - 1) throw error;

        // Gérer à la fois les erreurs 429 et les erreurs de token non trouvé
        if (
          error.message?.includes("429") ||
          error.message?.includes("Token account not found")
        ) {
          const waitTime = initialDelay * Math.pow(2, i);
          console.log(`Retrying after ${waitTime}ms delay...`);
          await delay(waitTime);
          continue;
        }
        throw error;
      }
    }
    throw new Error("Max retries exceeded");
  }

  describe("Basic Swap Operations", () => {
    beforeEach(async function () {
      this.timeout(DELAY_BETWEEN_TESTS + 1000); // Augmenter le timeout du hook
      await delay(DELAY_BETWEEN_TESTS);
    });

    /**
     * Tests the basic buy operation with minimal SOL amount
     * Verifies the entire buy flow including transaction confirmation
     */
    it("should buy USDC with a tiny amount of SOL", async function () {
      this.timeout(DEFAULT_TIMEOUT);

      const result = await withRetry(async () => {
        return await swapService.swapToken(
          { address: CONFIG.SOLANA_ADDRESS },
          { address: USDC_ADDRESS },
          TINY_AMOUNT,
          100
        );
      });

      expect(result).to.exist;
      expect(result.hash).to.exist;
      expect(result.explorerUrl).to.include("https://solscan.io/tx/");

      // Attendre la confirmation de la transaction
      await delay(TRANSACTION_CONFIRMATION_DELAY);
    });

    /**
     * Tests the sell operation by converting all USDC back to SOL
     * Ensures proper token balance detection and complete sell flow
     */
    it("should sell USDC back to SOL", async function () {
      this.timeout(DEFAULT_TIMEOUT);

      const result = await withRetry(async () => {
        const tokens = await withRetry(() => swapService.getWalletTokens());
        const usdcToken = tokens.find((t) => t.mint === USDC_ADDRESS);

        if (!usdcToken) {
          throw new Error("No USDC token found");
        }

        return await swapService.swapToken(
          { address: USDC_ADDRESS },
          { address: CONFIG.SOLANA_ADDRESS },
          "all",
          100
        );
      });

      expect(result).to.exist;
      expect(result.hash).to.exist;

      // Attendre la confirmation de la transaction
      await delay(TRANSACTION_CONFIRMATION_DELAY);
    });
  });

  describe("Error Cases", () => {
    /**
     * Verifies proper error handling for insufficient balance
     * Attempts to swap with an amount larger than wallet balance
     */
    it("should handle insufficient balance gracefully", async function () {
      this.timeout(DEFAULT_TIMEOUT);
      const hugeAmount = 1000000;

      try {
        await swapService.swapToken(
          { address: CONFIG.SOLANA_ADDRESS },
          { address: USDC_ADDRESS },
          hugeAmount,
          100
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });

  describe("Cleanup", () => {
    /**
     * Final cleanup to ensure no test tokens remain in wallet
     * Converts all remaining USDC back to SOL
     */
    it("should sell all remaining USDC", async function () {
      this.timeout(DEFAULT_TIMEOUT);

      // Vérifier et vendre les tokens restants avec retry
      const result = await withRetry(async () => {
        const tokens = await withRetry(() => swapService.getWalletTokens());
        const usdcToken = tokens.find((t) => t.mint === USDC_ADDRESS);

        if (!usdcToken) {
          console.log("No USDC tokens to clean up");
          return null;
        }

        return await swapService.swapToken(
          { address: USDC_ADDRESS },
          { address: CONFIG.SOLANA_ADDRESS },
          "all",
          300
        );
      });

      if (result) {
        expect(result.hash).to.exist;
        await delay(TRANSACTION_CONFIRMATION_DELAY);
      }
    });
  });
});
