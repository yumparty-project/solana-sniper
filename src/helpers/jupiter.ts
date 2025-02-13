import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { JupiterQuoteResponse } from "../types";

/**
 * Gets a quote from Jupiter API
 * @param inputMint - Input token mint address
 * @param outputMint - Output token mint address
 * @param amount - Amount to swap in raw units
 * @param slippage - Maximum allowed slippage in basis points
 * @returns Quote data from Jupiter
 * @throws Error if quote request fails
 */
export const getJupiterQuote = async (
  inputMint: string,
  outputMint: string,
  amount: BigNumber,
  slippage: number
): Promise<JupiterQuoteResponse> => {
  const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount.toFixed(
    0
  )}&slippageBps=${slippage}`;

  const response = await fetch(quoteUrl);
  const quoteData = (await response.json()) as JupiterQuoteResponse;

  if (!quoteData || !quoteData.outAmount) {
    throw new Error(
      `Failed to get quote: ${(quoteData as any)?.error || "Unknown error"}`
    );
  }

  return quoteData;
};

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
