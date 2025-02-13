import { CONFIG } from "../config";

/**
 * @helpers Format
 * Helper functions for formatting swap results and transaction data
 *
 * Contains utilities for:
 * - Formatting transaction results
 * - Generating explorer links
 * - Creating DEXScreener URLs
 */

/**
 * Formats swap result with transaction links
 * @param txid - Transaction ID
 * @param inputToken - Input token information
 * @param outputToken - Output token information
 * @param walletPublicKey - User's wallet public key
 * @returns Formatted swap result
 */
export const formatSwapResult = (
  txid: string,
  inputToken: { address: string },
  outputToken: { address: string },
  walletPublicKey: string
): any => {
  return {
    status: "success",
    hash: txid,
    explorerUrl: `https://solscan.io/tx/${txid}`,
    dexscreenerUrl: `https://dexscreener.com/solana/${
      inputToken.address === CONFIG.SOLANA_ADDRESS
        ? outputToken.address
        : inputToken.address
    }?maker=${walletPublicKey}`,
  };
};
