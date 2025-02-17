import { Connection, VersionedTransaction } from "@solana/web3.js";
import { expect } from "chai";
import sinon from "sinon";
import {
  prepareTransaction,
  sendAndConfirmTransaction,
} from "../../src/helpers/transaction";

/**
 * @tests Transaction Helper
 * Unit tests for Solana transaction handling
 *
 * Tests:
 * - Transaction preparation
 * - Transaction signing
 * - Transaction sending and confirmation
 */
describe("Transaction Helper", () => {
  /**
   * @tests Transaction Preparation
   * Tests for transaction preparation and signing
   */
  describe("prepareTransaction", () => {
    /**
     * @test Sign Transaction
     * Verifies transaction deserialization and signing
     * Uses mocked transaction data
     */
    it("should prepare and sign a transaction", () => {
      // Mock data
      const mockSwapData = {
        swapTransaction: Buffer.from("mock-transaction").toString("base64"),
      };
      const mockSigner = {
        publicKey: "mock-public-key",
        secretKey: "mock-secret-key",
      };

      // Mock VersionedTransaction
      const mockTransaction = {
        sign: sinon.spy(),
      };
      sinon
        .stub(VersionedTransaction, "deserialize")
        .returns(mockTransaction as any);

      // Execute
      const result = prepareTransaction(mockSwapData, [mockSigner]);

      // Verify
      expect(mockTransaction.sign.calledOnce).to.be.true;
      expect(mockTransaction.sign.calledWith([mockSigner])).to.be.true;
      expect(result).to.equal(mockTransaction);

      // Cleanup
      sinon.restore();
    });
  });

  /**
   * @tests Transaction Sending
   * Tests for transaction submission and confirmation
   */
  describe("sendAndConfirmTransaction", () => {
    let connection: sinon.SinonStubbedInstance<Connection>;
    let mockTransaction: VersionedTransaction;

    beforeEach(() => {
      // Initialisation plus complète du mock
      connection = {
        getLatestBlockhash: sinon.stub(),
        sendTransaction: sinon.stub(),
        confirmTransaction: sinon.stub(),
        sendRawTransaction: sinon.stub(),
      } as any;

      mockTransaction = {
        serialize: () => Buffer.from("mock-serialized-tx"),
        version: "legacy",
      } as any;
    });

    /**
     * @test Successful Transaction
     * Tests complete transaction flow
     * Verifies proper confirmation handling
     */
    it("should successfully send and confirm a transaction", async () => {
      // Configuration des mocks avec des valeurs plus réalistes
      const mockTxId = "mock-tx-id";
      const mockBlockhash = {
        blockhash: "mock-blockhash",
        lastValidBlockHeight: 1234,
      };
      const mockConfirmation = {
        context: { slot: 1234 },
        value: { err: null },
      };

      connection.getLatestBlockhash.resolves(mockBlockhash);
      connection.sendTransaction.resolves(mockTxId);
      connection.sendRawTransaction.resolves(mockTxId);
      connection.confirmTransaction.resolves(mockConfirmation);

      const result = await sendAndConfirmTransaction(
        connection as unknown as Connection,
        mockTransaction
      );

      expect(result).to.equal(mockTxId);
    });

    /**
     * @test Failed Transaction
     * Tests error handling for failed transactions
     * Verifies proper error propagation
     */
    it("should throw error when transaction confirmation fails", async () => {
      // Mock data
      const mockBlockhash = {
        blockhash: "mock-blockhash",
        lastValidBlockHeight: 1234,
      };
      const mockConfirmation = {
        value: { err: "mock-error" },
      };

      // Setup stubs
      connection.getLatestBlockhash.resolves(mockBlockhash);
      connection.sendTransaction.resolves("mock-tx-id");
      connection.confirmTransaction.resolves(mockConfirmation as any);

      // Execute and verify
      try {
        await sendAndConfirmTransaction(
          connection as unknown as Connection,
          mockTransaction
        );
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.equal("Transaction failed: mock-error");
      }
    });
  });
});
