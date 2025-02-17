import { createJupiterApiClient } from "@jup-ag/api";

const jupiterQuoteApi = createJupiterApiClient();

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
): Promise<any> {
  try {
    const quote = await jupiterQuoteApi.quoteGet({
      inputMint,
      outputMint,
      amount,
      slippageBps,
      // Optionnel: asLegacyTransaction: false, // Par défaut utilise les transactions versionnées
    });

    if (!quote) {
      throw new Error("No quote returned from Jupiter API");
    }

    return quote;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching quote: ${error.message}`);
    }
    throw new Error("Unknown error while fetching quote");
  }
}
