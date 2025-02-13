import { Connection, PublicKey } from "@solana/web3.js";

/**
 * Gets token decimals for a mint address
 * @param connection - Solana connection
 * @param mintAddress - Token mint address
 * @returns Number of decimals for the token
 * @throws Error if unable to fetch decimals
 */
export async function getTokenDecimals(
  connection: Connection,
  mintAddress: string
): Promise<number> {
  const mintPublicKey = new PublicKey(mintAddress);
  const tokenAccountInfo = await connection.getParsedAccountInfo(mintPublicKey);

  // Check if the data is parsed and contains the expected structure
  if (
    tokenAccountInfo.value &&
    typeof tokenAccountInfo.value.data === "object" &&
    "parsed" in tokenAccountInfo.value.data
  ) {
    const parsedInfo = tokenAccountInfo.value.data.parsed?.info;
    if (parsedInfo && typeof parsedInfo.decimals === "number") {
      return parsedInfo.decimals;
    }
  }

  throw new Error("Unable to fetch token decimals");
}
