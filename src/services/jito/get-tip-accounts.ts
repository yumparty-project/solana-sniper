import { CONFIG } from "../../config";

/**
 * Retrieves tip accounts from the Jito RPC
 * @returns Array of tip accounts
 */
export async function getTipAccounts() {
  try {
    const response = await fetch(CONFIG.JITO_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTipAccounts",
        params: [],
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result;
  } catch (error) {
    console.error(
      "❌ Error getting tip accounts:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error;
  }
}
