import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { expect } from "chai";
import dotenv from "dotenv";
import { CONFIG } from "../../src/config";
import { checkBundleStatus } from "../../src/services/jito/check-bundle-status";
import { getTipAccounts } from "../../src/services/jito/get-tip-accounts";
import { swap } from "../../src/services/jito/swap";

dotenv.config();

if (!CONFIG.SOLANA_PRIVATE_KEY) {
  throw new Error("SOLANA_PRIVATE_KEY not found in .env");
}

const secretKey = bs58.decode(CONFIG.SOLANA_PRIVATE_KEY);
const wallet = Keypair.fromSecretKey(secretKey);

/**
 * Unit tests for the Jito Service
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
describe("Jito Service Tests", () => {
  // Augmenter les timeouts pour les tests longs
  const DEFAULT_TIMEOUT = 120000; // 120 secondes
  const DELAY_BETWEEN_TESTS = 5000; // 5 secondes
  const TRANSACTION_CONFIRMATION_DELAY = 15000; // 15 secondes

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  describe("Basic Swap Operations", () => {
    beforeEach(async function () {
      this.timeout(DELAY_BETWEEN_TESTS + 1000);
      await delay(DELAY_BETWEEN_TESTS);
    });

    it("should swap SOL to USDC with a tiny amount", async function () {
      this.timeout(DEFAULT_TIMEOUT);
      let swapResult;

      try {
        swapResult = await swap(
          CONFIG.SOLANA_ADDRESS,
          CONFIG.USDC_ADDRESS,
          0.000001, // Tiny amount of SOL
          100, // 1% slippage
          5, // Augmenter le nombre de retries
          wallet
        );

        expect(swapResult).to.exist;
        expect(swapResult?.signature).to.be.a("string");
        expect(swapResult?.bundleStatus).to.exist;

        // Attendre la confirmation de la transaction
        await delay(TRANSACTION_CONFIRMATION_DELAY);
      } catch (error: any) {
        console.error("Swap error:", error);
        throw error;
      }
    });
  });

  describe("Error Cases", () => {
    it("should handle invalid token addresses", async function () {
      this.timeout(DEFAULT_TIMEOUT);
      try {
        await swap(
          "invalid-token-address",
          CONFIG.USDC_ADDRESS,
          0.000001,
          100,
          1, // Réduire le nombre de retries pour accélérer le test
          wallet
        );
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.match(/invalid|Invalid|Non-base58/);
      }
    });

    it("should handle insufficient balance gracefully", async function () {
      this.timeout(DEFAULT_TIMEOUT);
      try {
        await swap(
          CONFIG.SOLANA_ADDRESS,
          CONFIG.USDC_ADDRESS,
          1000, // Montant très élevé
          100,
          1, // Réduire le nombre de retries
          wallet
        );
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.match(/Failed to simulate transaction/);
      }
    });

    it("should handle invalid slippage values", async function () {
      this.timeout(DEFAULT_TIMEOUT);
      try {
        await swap(
          CONFIG.SOLANA_ADDRESS,
          CONFIG.USDC_ADDRESS,
          0.000001,
          -100, // Slippage négatif
          1, // Réduire le nombre de retries
          wallet
        );
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.match(/slippage|error|invalid/i);
      }
    });
  });

  describe("Jito API Operations", () => {
    it("should get tip accounts successfully", async function () {
      this.timeout(DEFAULT_TIMEOUT);
      const tipAccounts = await getTipAccounts();
      expect(tipAccounts).to.be.an("array");
      expect(tipAccounts.length).to.be.greaterThan(0);
      tipAccounts.forEach((account: string) => {
        expect(account).to.be.a("string");
        expect(account).to.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
      });
    });

    it("should check bundle status", async function () {
      this.timeout(DEFAULT_TIMEOUT);

      try {
        // D'abord créer un bundle via un swap
        const swapResult = await swap(
          CONFIG.SOLANA_ADDRESS,
          CONFIG.USDC_ADDRESS,
          0.000001,
          100,
          5, // Augmenter le nombre de retries
          wallet
        );

        expect(swapResult?.bundleStatus).to.exist;
        const bundleId = swapResult?.bundleStatus?.bundleId;

        if (bundleId) {
          // Augmenter le délai d'attente pour le traitement du bundle
          await delay(10000);

          const status = await checkBundleStatus(bundleId);
          expect(status).to.exist;
          expect(status?.bundleId).to.equal(bundleId);
          expect(status?.status).to.be.oneOf([
            "Landed",
            "Processing",
            "Failed",
            "Invalid",
            "Pending",
          ]);
        }
      } catch (error: any) {
        console.error("Bundle status check error:", error);
        throw error;
      }
    });
  });

  after(async function () {
    this.timeout(DEFAULT_TIMEOUT);
    let swapResult;

    try {
      // Attendre un peu avant de faire le swap retour
      await delay(5000);

      swapResult = await swap(
        CONFIG.USDC_ADDRESS,
        CONFIG.SOLANA_ADDRESS,
        0.000001,
        100,
        5, // Augmenter le nombre de retries
        wallet
      );

      expect(swapResult).to.exist;
      expect(swapResult?.signature).to.be.a("string");
      expect(swapResult?.bundleStatus).to.exist;

      // Attendre la confirmation de la transaction
      await delay(TRANSACTION_CONFIRMATION_DELAY);
    } catch (error: any) {
      console.error("Swap error:", error);
      throw error;
    }
  });
});
