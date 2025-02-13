import { Connection } from "@solana/web3.js";
import chalk from "chalk";
import { config as dotenvConfig } from "dotenv";
import inquirer from "inquirer";
import ora from "ora";
import { CONFIG } from "../../src/config";
import { getWalletKey } from "../../src/helpers/get-wallet-key";
import { SwapService } from "../../src/services/swap";
import { animateSwap } from "./helpers/animate-swap";
import { displayTitle } from "./helpers/displat-title";
import { displayWalletTokens } from "./helpers/display-wallet-tokens";
import { promptForSwapDetails } from "./helpers/prompt-swap-details";

dotenvConfig();

if (!process.env.SOLANA_PRIVATE_KEY) {
  throw new Error("SOLANA_PRIVATE_KEY not found in .env");
}

/**
 * Example application entry point
 * Handles the main application loop and error management
 */
const main = async () => {
  try {
    await displayTitle();

    const spinner = ora("Connecting to Solana...").start();
    const connection = new Connection(CONFIG.SOLANA_RPC);
    const keypair = await getWalletKey();
    spinner.succeed("Connected to Solana!");

    const swapService = new SwapService(connection, keypair);

    while (true) {
      await displayWalletTokens(swapService);
      const swapDetails = await promptForSwapDetails();

      if (swapDetails === null) {
        console.log(chalk.red("Exiting..."));
        process.exit(0);
      }

      spinner.text = "Preparing transaction...";
      spinner.start();

      let result;
      if (swapDetails.type === "sell_percentage") {
        result = await swapService.sellToken({
          tokenAddress: swapDetails.tokenAddress,
          percentage: swapDetails.percentage,
          slippage: Math.round(swapDetails.slippage * 100),
        });
      } else {
        result = await swapService.swapToken(
          { address: swapDetails.inputToken },
          { address: swapDetails.outputToken },
          swapDetails.amount,
          Math.round(swapDetails.slippage * 100)
        );
      }

      spinner.succeed("Swap transaction submitted!");

      await animateSwap();

      console.log(chalk.green("\n✨ Transaction Details:"));
      console.log(chalk.cyan("Hash:"), result.hash);
      console.log(chalk.cyan("Explorer:"), result.explorerUrl);
      console.log(chalk.cyan("DEXScreener:"), result.dexscreenerUrl);

      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "What do you want to do next?",
          choices: ["Back to menu", "Exit"],
        },
      ]);
      if (action === "Exit") {
        process.exit(0);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red("\n❌ Error:"), error.message);
    } else {
      console.error(chalk.red("\n❌ Unknown error occurred"));
    }
    process.exit(1);
  }
};

// Start the CLI application (for testing purposes)
main().catch(console.error);
