import { swap } from "./swap";

async function main() {
  try {
    const inputMint = "So11111111111111111111111111111111111111112"; // Wrapped SOL
    const outputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC
    const amount = 0.001; // 0.01 SOL
    const initialSlippageBps = 100; // 1% initial slippage
    const maxRetries = 5;

    console.log("\n🚀 Starting swap operation...");
    console.log(`Input: ${amount} SOL`);
    console.log(`Output: USDC`);
    console.log(`Initial Slippage: ${initialSlippageBps / 100}%`);

    const result = await swap(
      inputMint,
      outputMint,
      amount,
      initialSlippageBps,
      maxRetries,
      walletPublicKey
    );

    console.log("\n🎉 Swap completed successfully!");
    console.log("Swap result:");
    console.log(JSON.stringify(result?.bundleStatus, null, 2));
    console.log("\n🖋️  Transaction signature:", result?.signature);
    console.log(
      `🔗 View on Solscan: https://solscan.io/tx/${result?.signature}`
    );
  } catch (error) {
    console.error("\n💥 Error in main function:");
    console.error((error as any).message);
  }
}

main();
