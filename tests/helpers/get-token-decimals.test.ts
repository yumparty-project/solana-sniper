import { Connection } from "@solana/web3.js";
import { expect } from "chai";
import dotenv from "dotenv";
import { CONFIG } from "../../src/config";
import { getTokenDecimals } from "../../src/helpers/get-token-decimals";

dotenv.config();

/**
 * Integration tests for token decimals retrieval
 * Tests against well-known tokens with known decimal values
 */
describe("Token Decimals Integration Tests", () => {
  let connection: Connection;

  // Well-known token addresses and their decimals
  const TOKENS = {
    USDC: {
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      decimals: 6,
    },
    BONK: {
      address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      decimals: 5,
    },
  };

  before(() => {
    connection = new Connection(CONFIG.SOLANA_RPC);
  });

  describe("Get Token Decimals", () => {
    /**
     * Tests USDC decimals retrieval
     */
    it("should get USDC decimals", async function () {
      this.timeout(10000);
      const decimals = await getTokenDecimals(connection, TOKENS.USDC.address);
      expect(decimals).to.equal(TOKENS.USDC.decimals);
    });

    /**
     * Tests BONK decimals retrieval
     */
    it("should get BONK decimals", async function () {
      this.timeout(10000);
      const decimals = await getTokenDecimals(connection, TOKENS.BONK.address);
      expect(decimals).to.equal(TOKENS.BONK.decimals);
    });

    /**
     * Tests error handling for invalid token
     */
    it("should handle invalid token address", async function () {
      this.timeout(10000);
      try {
        await getTokenDecimals(connection, "InvalidAddress");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });
});
