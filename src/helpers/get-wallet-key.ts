import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

/**
 * Gets wallet keypair from environment private key
 * @returns Promise containing keypair object
 * @throws Error if private key is missing or invalid
 */
export async function getWalletKey(): Promise<any> {
  const privateKeyString = process.env.SOLANA_PRIVATE_KEY;

  if (!privateKeyString) {
    throw new Error("Private key not found in settings");
  }

  try {
    // First try base58
    const secretKey = bs58.decode(privateKeyString);
    return { keypair: Keypair.fromSecretKey(secretKey) };
  } catch (e) {
    console.log("Error decoding base58 private key:", e);
    try {
      // Then try base64
      console.log("Try decoding base64 instead");
      const secretKey = Uint8Array.from(
        Buffer.from(privateKeyString, "base64")
      );
      return { keypair: Keypair.fromSecretKey(secretKey) };
    } catch (e2) {
      console.error("Error decoding private key: ", e2);
      throw new Error("Invalid private key format");
    }
  }
}
