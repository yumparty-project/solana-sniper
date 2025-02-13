import { Connection, PublicKey } from "@solana/web3.js";
import { TokenBalance } from "../types";
/**
 * @helpers Balance
 * Helper functions for retrieving SOL and SPL token balances
 *
 * Features:
 * - Get SOL balance for any wallet
 * - Get SPL token balances
 * - Support for connected wallet and specified addresses
 * - Balance formatting with proper decimals
 *
 * @requires @solana/web3.js
 * @requires zod - For parameter validation
 */

/**
 * Gets SOL balance for a wallet
 * @param connection - Solana connection
 * @param walletPublicKey - Wallet public key
 * @returns Balance in SOL and raw lamports
 */
export async function getSolBalance(
  connection: Connection,
  walletPublicKey: PublicKey
): Promise<{
  balance: number;
  uiBalance: number;
}> {
  const balance = await connection.getBalance(walletPublicKey);
  return {
    balance: balance,
    uiBalance: balance / 1e9,
  };
}

/**
 * Gets SPL token balance for a wallet
 * @param connection - Solana connection
 * @param walletPublicKey - Wallet public key
 * @param tokenMintAddress - Token mint address
 * @returns Token balance with decimals or null if not found
 */
export async function getSplTokenBalance(
  connection: Connection,
  walletPublicKey: PublicKey,
  tokenMintAddress: string
): Promise<TokenBalance | null> {
  try {
    const tokenAccounts = await connection.getTokenAccountsByOwner(
      walletPublicKey,
      {
        mint: new PublicKey(tokenMintAddress),
      }
    );

    if (tokenAccounts.value.length === 0) {
      return null;
    }
    if (!tokenAccounts.value[0]) {
      return null;
    }
    const tokenBalance = await connection.getTokenAccountBalance(
      tokenAccounts.value[0].pubkey
    );

    return {
      amount: Number(tokenBalance.value.amount),
      decimals: tokenBalance.value.decimals,
      uiAmount: tokenBalance.value.uiAmount || 0,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du solde SPL:", error);
    return null;
  }
}

// function getKeypairFromPrivateKey(privateKey: string): Keypair {
//   try {
//     const secretKey = bs58.decode(privateKey);
//     return Keypair.fromSecretKey(secretKey);
//   } catch (e) {
//     try {
//       const secretKey = Uint8Array.from(Buffer.from(privateKey, "base64"));
//       return Keypair.fromSecretKey(secretKey);
//     } catch (e2) {
//       throw new Error("Format de clé privée invalide");
//     }
//   }
// }
