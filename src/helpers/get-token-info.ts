import { Connection, PublicKey } from "@solana/web3.js";
import { CONFIG } from "../config";

/**
 * Retrieves token information from the Solana RPC
 * @param mint - Mint address of the token
 * @returns Token information with decimals
 */
export async function getTokenInfo(mint: any) {
  const connection = new Connection(CONFIG.SOLANA_RPC);
  const mintAccount = new PublicKey(mint);
  const mintInfo: any = await connection.getParsedAccountInfo(mintAccount);

  if (!mintInfo.value || !mintInfo.value.data || !mintInfo.value.data.parsed) {
    throw new Error(`❌ Failed to fetch token info for mint: ${mint}`);
  }

  const { decimals } = mintInfo.value.data.parsed.info;
  return { decimals };
}
