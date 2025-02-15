import { CONFIG } from "../../config";

export async function getSwapInstructions(
  quoteResponse: any,
  userPublicKey: string
) {
  const response = await fetch(`${CONFIG.JUPITER_V6_API}/swap-instructions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapUnwrapSOL: true,
    }),
  });
  const data = await response.json();
  return data;
}
