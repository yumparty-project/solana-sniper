import { CONFIG } from "../../config";

/**
 * Retrieves a quote from the Jupiter API
 * @param inputMint - Input mint address
 * @param outputMint - Output mint address
 * @param amount - Amount to swap
 * @param slippageBps - Slippage percentage
 * @returns Quote data
 */
export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number
) {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps: slippageBps.toString(),
  });

  const response = await fetch(`${CONFIG.JUPITER_V6_API}/quote?${params}`);
  const data = await response.json();
  return data;
}
