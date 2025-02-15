import { CONFIG } from "../../config";

/**
 * Sends a Jito bundle to the Jito RPC
 * @param bundle - Bundle to send
 * @returns Bundle result
 */
export async function sendJitoBundle(bundle: any) {
  try {
    const response = await fetch(CONFIG.JITO_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "sendBundle",
        params: [bundle],
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result;
  } catch (error) {
    console.error(
      "❌ Error sending Jito bundle:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error;
  }
}
