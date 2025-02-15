import { CONFIG } from "../../config";

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
