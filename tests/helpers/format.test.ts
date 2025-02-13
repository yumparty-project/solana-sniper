import { expect } from "chai";
import { CONFIG } from "../../src/config";
import { formatSwapResult } from "../../src/helpers/format";

/**
 * @tests Format Helper
 * Tests for transaction result formatting functions
 *
 * Verifies:
 * - Proper URL generation for explorer and DEXScreener
 * - Correct handling of SOL vs token swaps
 * - Transaction hash formatting
 */
describe("Format Helper", () => {
  /**
   * @tests formatSwapResult
   * Tests for swap result formatting functionality
   */
  describe("formatSwapResult", () => {
    const mockTxId = "mock-tx-id";
    const mockWalletPublicKey = "mock-wallet-public-key";

    /**
     * @test SOL Input Format
     * Verifies correct formatting when input token is SOL
     * Should use output token address for DEXScreener URL
     */
    it("should format result when input is SOL", () => {
      // Mock data
      const inputToken = { address: CONFIG.SOLANA_ADDRESS };
      const outputToken = { address: "mock-token-address" };

      // Execute
      const result = formatSwapResult(
        mockTxId,
        inputToken,
        outputToken,
        mockWalletPublicKey
      );

      // Verify
      expect(result).to.deep.equal({
        status: "success",
        hash: mockTxId,
        explorerUrl: `https://solscan.io/tx/${mockTxId}`,
        dexscreenerUrl: `https://dexscreener.com/solana/${outputToken.address}?maker=${mockWalletPublicKey}`,
      });
    });

    /**
     * @test Token Input Format
     * Verifies correct formatting when input token is not SOL
     * Should use input token address for DEXScreener URL
     */
    it("should format result when input is token", () => {
      // Mock data
      const inputToken = { address: "mock-token-address" };
      const outputToken = { address: CONFIG.SOLANA_ADDRESS };

      // Execute
      const result = formatSwapResult(
        mockTxId,
        inputToken,
        outputToken,
        mockWalletPublicKey
      );

      // Verify
      expect(result).to.deep.equal({
        status: "success",
        hash: mockTxId,
        explorerUrl: `https://solscan.io/tx/${mockTxId}`,
        dexscreenerUrl: `https://dexscreener.com/solana/${inputToken.address}?maker=${mockWalletPublicKey}`,
      });
    });
  });
});
