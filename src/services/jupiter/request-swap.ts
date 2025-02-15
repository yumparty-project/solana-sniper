import { PublicKey } from "@solana/web3.js";

/**
 * Requests swap data from Jupiter API
 * @param quoteResponse - Quote response from Jupiter
 * @param userPublicKey - User's public key
 * @returns Swap transaction data
 */
export const requestJupiterSwap = async (
  quoteResponse: any,
  userPublicKey: PublicKey
): Promise<any> => {
  const swapRequestBody = {
    quoteResponse,
    userPublicKey: userPublicKey.toString(),
    wrapAndUnwrapSol: true,
    computeUnitPriceMicroLamports: 2000000,
    dynamicComputeUnitLimit: true,
  };

  const response = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(swapRequestBody),
  });

  return await response.json();
};
