import { Keypair } from "@solana/web3.js";
import { expect } from "chai";
import { CONFIG } from "../../src/config";
import { getQuote } from "../../src/services/jupiter/get-quote";
import { getSwapInstructions } from "../../src/services/jupiter/get-swap-instructions";

describe("Jupiter Service", () => {
  let keypair: Keypair;

  before(() => {
    keypair = Keypair.generate();
  });

  describe("getQuote", () => {
    it("should return quote data when successful", async () => {
      const result = await getQuote(
        CONFIG.SOLANA_ADDRESS,
        CONFIG.USDC_ADDRESS,
        1000000,
        100
      );

      expect(result).to.not.be.null;
      expect(result.inputMint).to.equal(CONFIG.SOLANA_ADDRESS);
      expect(result.outputMint).to.equal(CONFIG.USDC_ADDRESS);
      expect(result.inAmount).to.be.a("string");
      expect(result.outAmount).to.be.a("string");
    });

    it("should throw error for invalid input mint", async () => {
      try {
        await getQuote(
          "invalid-mint-address",
          CONFIG.USDC_ADDRESS,
          1000000,
          100
        );
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.match(
          /Failed to get quote|Error fetching quote/
        );
      }
    });
  });

  describe("getSwapInstructions", () => {
    it("should return swap instructions for valid quote", async () => {
      const quote = await getQuote(
        CONFIG.SOLANA_ADDRESS,
        CONFIG.USDC_ADDRESS,
        1000000,
        100
      );

      const result = await getSwapInstructions(
        quote,
        keypair.publicKey.toString()
      );

      expect(result).to.have.property("setupInstructions");
      expect(result).to.have.property("swapInstruction");
      expect(result).to.have.property("cleanupInstruction");
      expect(result).to.have.property("addressLookupTableAddresses");
    });
  });
});
