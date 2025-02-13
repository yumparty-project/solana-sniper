import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { expect } from "chai";
import dotenv from "dotenv";
import { CONFIG } from "../../src/config";
import {
  getSolBalance,
  getSplTokenBalance,
} from "../../src/helpers/get-balance";

dotenv.config();

/**
 * Integration tests for balance checking functions
 *
 * IMPORTANT: These tests require:
 * - A test wallet with some SOL (~0.1 is enough)
 * - SOLANA_PRIVATE_KEY in .env
 */
describe("Balance Integration Tests", () => {
  let connection: Connection;
  let keypair: Keypair;
  const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  before(() => {
    if (!process.env.SOLANA_PRIVATE_KEY) {
      throw new Error("SOLANA_PRIVATE_KEY not found in .env");
    }

    connection = new Connection(CONFIG.SOLANA_RPC);
    const secretKey = bs58.decode(process.env.SOLANA_PRIVATE_KEY);
    keypair = Keypair.fromSecretKey(secretKey);
  });

  describe("SOL Balance", () => {
    /**
     * Tests SOL balance retrieval
     * Verifies that the wallet has some SOL
     */
    it("should get SOL balance", async function () {
      this.timeout(10000);
      const result = await getSolBalance(connection, keypair.publicKey);

      expect(result).to.exist;
      expect(result.balance).to.be.a("number");
      expect(result.balance).to.be.greaterThan(0);
      expect(result.uiBalance).to.equal(result.balance / 1e9);
    });
  });

  describe("SPL Token Balance", () => {
    /**
     * Tests USDC balance retrieval
     * Note: Balance might be 0 if wallet has no USDC
     */
    it("should get USDC token balance", async function () {
      this.timeout(10000);
      const result = await getSplTokenBalance(
        connection,
        keypair.publicKey,
        USDC_ADDRESS
      );

      expect(result).to.not.be.undefined;
      if (result) {
        expect(result.decimals).to.equal(6); // USDC has 6 decimals
        expect(result.amount).to.be.a("number");
        expect(result.uiAmount).to.be.a("number");
      }
    });

    /**
     * Tests error handling for invalid token address
     */
    it("should handle invalid token address", async function () {
      this.timeout(10000);
      const result = await getSplTokenBalance(
        connection,
        keypair.publicKey,
        "InvalidTokenAddress"
      );

      expect(result).to.be.null;
    });
  });
});
