import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { expect } from "chai";
import dotenv from "dotenv";
import sinon from "sinon";
import { CONFIG } from "../../src/config";
import { checkBundleStatus } from "../../src/services/jito/check-bundle-status";
import { getTipAccounts } from "../../src/services/jito/get-tip-accounts";
import { sendJitoBundle } from "../../src/services/jito/send-jito-bundle";
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
  const WRAPPED_SOL = "So11111111111111111111111111111111111111112";
  const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const TINY_AMOUNT = 0.000001;

  // Timeouts and delays
  const DEFAULT_TIMEOUT = 60000; // 60 seconds
  const DELAY_BETWEEN_TESTS = 5000; // 5 seconds
  const TRANSACTION_CONFIRMATION_DELAY = 8000; // 8 seconds

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  let fetchStub: sinon.SinonStub;

  beforeEach(() => {
    fetchStub = sinon.stub(global, "fetch");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("Basic Swap Operations", () => {
    beforeEach(async function () {
      this.timeout(DELAY_BETWEEN_TESTS + 1000);
      await delay(DELAY_BETWEEN_TESTS);
    });

    /**
     * Tests the basic swap operation from SOL to USDC with minimal amount
     */
    it("should swap SOL to USDC with a tiny amount", async function () {
      this.timeout(DEFAULT_TIMEOUT);

      const result = await swap(
        WRAPPED_SOL,
        USDC_ADDRESS,
        TINY_AMOUNT,
        100, // 1% slippage
        3, // max retries
        wallet
      );

      expect(result).to.exist;
      expect(result?.signature).to.be.a("string");
      expect(result?.bundleStatus).to.exist;

      await delay(TRANSACTION_CONFIRMATION_DELAY);
    });

    /**
     * Tests the swap operation from USDC back to SOL
     */
    it("should swap USDC back to SOL", async function () {
      this.timeout(DEFAULT_TIMEOUT);

      const result = await swap(
        USDC_ADDRESS,
        WRAPPED_SOL,
        TINY_AMOUNT,
        100, // 1% slippage
        3, // max retries
        wallet
      );

      expect(result).to.exist;
      expect(result?.signature).to.be.a("string");
      expect(result?.bundleStatus).to.exist;

      await delay(TRANSACTION_CONFIRMATION_DELAY);
    });
  });

  describe("Error Cases", () => {
    /**
     * Tests error handling for invalid token addresses
     */
    it("should handle invalid token addresses", async function () {
      this.timeout(DEFAULT_TIMEOUT);
      const invalidAddress = "InvalidTokenAddress";

      try {
        await swap(invalidAddress, USDC_ADDRESS, TINY_AMOUNT, 100, 3, wallet);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error).to.exist;
        expect(error.message).to.include("invalid");
      }
    });

    /**
     * Tests error handling for insufficient balance
     */
    it("should handle insufficient balance gracefully", async function () {
      this.timeout(DEFAULT_TIMEOUT);
      const hugeAmount = 1000000;

      try {
        await swap(WRAPPED_SOL, USDC_ADDRESS, hugeAmount, 100, 3, wallet);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error).to.exist;
        expect(error.message).to.include("insufficient");
      }
    });

    /**
     * Tests error handling for invalid slippage values
     */
    it("should handle invalid slippage values", async function () {
      this.timeout(DEFAULT_TIMEOUT);
      const invalidSlippage = -100;

      try {
        await swap(
          WRAPPED_SOL,
          USDC_ADDRESS,
          TINY_AMOUNT,
          invalidSlippage,
          3,
          wallet
        );
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error).to.exist;
        expect(error.message).to.include("slippage");
      }
    });
  });

  describe("checkBundleStatus", () => {
    it("should return bundle status when successful", async () => {
      const mockResponse = {
        result: {
          value: [
            {
              bundle_id: "test-bundle",
              status: "Landed",
              landed_slot: 123,
            },
          ],
        },
      };

      fetchStub.resolves({
        json: async () => mockResponse,
      } as Response);

      const result = await checkBundleStatus("test-bundle");

      expect(result).to.deep.equal({
        bundleId: "test-bundle",
        status: "Landed",
        landedSlot: 123,
      });
    });

    it("should handle errors gracefully", async () => {
      fetchStub.rejects(new Error("Network error"));

      const result = await checkBundleStatus("test-bundle");
      expect(result).to.be.null;
    });
  });

  describe("getTipAccounts", () => {
    it("should return tip accounts when successful", async () => {
      const mockTipAccounts = ["account1", "account2"];
      fetchStub.resolves({
        json: async () => ({ result: mockTipAccounts }),
      } as Response);

      const result = await getTipAccounts();
      expect(result).to.deep.equal(mockTipAccounts);
    });

    it("should throw error when request fails", async () => {
      fetchStub.resolves({
        json: async () => ({
          error: { message: "Failed to get tip accounts" },
        }),
      } as Response);

      try {
        await getTipAccounts();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.equal("Failed to get tip accounts");
      }
    });
  });

  describe("sendJitoBundle", () => {
    it("should send bundle successfully", async () => {
      const mockResult = { bundleId: "test-bundle" };
      fetchStub.resolves({
        json: async () => ({ result: mockResult }),
      } as Response);

      const result = await sendJitoBundle(["tx1", "tx2"]);
      expect(result).to.deep.equal(mockResult);
    });

    it("should throw error when sending fails", async () => {
      fetchStub.resolves({
        json: async () => ({ error: { message: "Failed to send bundle" } }),
      } as Response);

      try {
        await sendJitoBundle(["tx1"]);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.equal("Failed to send bundle");
      }
    });
  });
});
