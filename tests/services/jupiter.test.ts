import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import sinon from "sinon";
import { CONFIG } from "../../src/config";
import { getQuote } from "../../src/services/jupiter/get-quote";
import { getSwapInstructions } from "../../src/services/jupiter/get-swap-instructions";
import { SwapService } from "../../src/services/jupiter/swap";

describe("Jupiter Service", () => {
  let fetchStub: sinon.SinonStub;
  let connectionStub: sinon.SinonStubbedInstance<Connection>;
  let swapService: SwapService;
  let keypair: Keypair;

  beforeEach(() => {
    fetchStub = sinon.stub(global, "fetch");
    connectionStub = sinon.createStubInstance(Connection);
    keypair = Keypair.generate();
    swapService = new SwapService(
      connectionStub as unknown as Connection,
      keypair
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("getQuote", () => {
    it("should return quote data when successful", async () => {
      const mockQuote = {
        inputMint: "input-mint",
        outputMint: "output-mint",
        inAmount: 1000,
        outAmount: 900,
        swapMode: "ExactIn",
      };

      fetchStub.resolves({
        json: async () => mockQuote,
      } as Response);

      const result = await getQuote("input-mint", "output-mint", 1000, 100);
      expect(result).to.deep.equal(mockQuote);
    });
  });

  describe("getSwapInstructions", () => {
    it("should return swap instructions when successful", async () => {
      const mockInstructions = {
        setupInstructions: [],
        swapInstruction: "swap-instruction",
        cleanupInstruction: null,
        addressLookupTableAddresses: [],
      };

      fetchStub.resolves({
        json: async () => mockInstructions,
      } as Response);

      const result = await getSwapInstructions(
        { quote: "data" },
        "user-pubkey"
      );
      expect(result).to.deep.equal(mockInstructions);
    });
  });

  describe("SwapService", () => {
    describe("swapToken", () => {
      it("should validate SOL amount correctly", async () => {
        connectionStub.getBalance.resolves(2000000000); // 2 SOL

        try {
          await swapService.swapToken(
            { address: CONFIG.SOLANA_ADDRESS },
            { address: "output-token" },
            3, // Try to swap 3 SOL with only 2 SOL balance
            50
          );
          expect.fail("Should have thrown insufficient balance error");
        } catch (error: any) {
          expect(error.message).to.include("Insufficient balance");
        }
      });

      it("should handle token validation", async () => {
        connectionStub.getParsedTokenAccountsByOwner.resolves({
          value: [
            {
              pubkey: new PublicKey("token-account"),
              account: {
                data: {
                  parsed: {
                    info: {
                      mint: "token-mint",
                      tokenAmount: {
                        uiAmount: 100,
                      },
                    },
                  },
                },
              },
            },
          ],
        });

        const tokens = await swapService.getWalletTokens();
        expect(tokens).to.have.lengthOf(1);
        expect(tokens[0].balance).to.equal(100);
      });
    });
  });
});
