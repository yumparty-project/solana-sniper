import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { expect } from "chai";
import { getJupiterQuote, requestJupiterSwap } from "../../src/helpers/jupiter";

/**
 * @tests Jupiter Helper
 * Integration tests for Jupiter DEX aggregator interactions
 *
 * Tests real API calls with:
 * - SOL/USDC pair
 * - Quote fetching
 * - Swap preparation
 */
describe("Jupiter Helper", () => {
  // Real token addresses for testing
  const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const SOL_ADDRESS = "So11111111111111111111111111111111111111112";

  /**
   * @tests Quote Fetching
   * Tests for Jupiter quote API integration
   */
  describe("getJupiterQuote", () => {
    /**
     * @test Valid Quote
     * Tests successful quote retrieval for SOL/USDC pair
     * Verifies all required quote properties
     */
    it("should successfully get a quote for SOL/USDC", async () => {
      const result = await getJupiterQuote(
        SOL_ADDRESS,
        USDC_ADDRESS,
        new BigNumber(1000000000), // 1 SOL
        50
      );

      expect(result).to.have.property("inputMint", SOL_ADDRESS);
      expect(result).to.have.property("outputMint", USDC_ADDRESS);
      expect(result).to.have.property("inAmount");
      expect(result).to.have.property("outAmount");
      expect(result).to.have.property("swapMode");
      expect(result).to.have.property("slippageBps", 50);
    });

    /**
     * @test Invalid Token
     * Tests error handling for invalid token addresses
     * Should throw appropriate error
     */
    it("should throw error when requesting invalid token", async () => {
      try {
        await getJupiterQuote(
          "invalid-address",
          USDC_ADDRESS,
          new BigNumber(1000000),
          50
        );
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.include("Failed to get quote");
      }
    });
  });

  /**
   * @tests Swap Request
   * Tests for Jupiter swap transaction preparation
   */
  describe("requestJupiterSwap", () => {
    /**
     * @test Valid Swap
     * Tests successful swap transaction preparation
     * Verifies transaction data structure
     */
    it("should successfully request swap data for SOL/USDC", async () => {
      // First get a quote
      const quote = await getJupiterQuote(
        SOL_ADDRESS,
        USDC_ADDRESS,
        new BigNumber(1000000000), // 1 SOL
        50
      );

      // Then request swap with the quote
      const mockPublicKey = new PublicKey("11111111111111111111111111111111");
      const result = await requestJupiterSwap(quote, mockPublicKey);

      expect(result).to.have.property("swapTransaction").that.is.a("string");
    });
  });
});
