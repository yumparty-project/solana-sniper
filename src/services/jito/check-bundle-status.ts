import { CONFIG } from "../../config";

/**
 * Checks the status of a bundle
 * @param bundleId - ID of the bundle to check
 * @returns Bundle status or null if no status found
 */
export async function checkBundleStatus(bundleId: string) {
  try {
    const response = await fetch(CONFIG.JITO_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getInflightBundleStatuses",
        params: [[bundleId]],
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const result = data.result.value[0];
    if (!result) {
      console.log(`ℹ️ No status found for bundle ID: ${bundleId}`);
      return null;
    }

    return {
      bundleId: result.bundle_id,
      status: result.status,
      landedSlot: result.landed_slot,
    };
  } catch (error) {
    console.error(
      "❌ Error checking bundle status:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

export async function checkBundleWithTimeout(
  bundleId: any,
  maxWaitTime = 45000
) {
  const startTime = Date.now();
  const checkInterval = 5000; // Check every 5 seconds

  while (Date.now() - startTime < maxWaitTime) {
    const bundleStatus = await checkBundleStatus(bundleId);

    if (bundleStatus && bundleStatus.status === "Landed") {
      return { success: true, status: bundleStatus };
    } else if (bundleStatus && bundleStatus.status === "Failed") {
      return { success: false, status: bundleStatus, error: "Bundle failed" };
    }

    console.log(
      `Bundle status: ${bundleStatus ? bundleStatus.status : "unknown"}`
    );
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  return { success: false, error: "Timeout waiting for bundle" };
}
