import chalk from "chalk";
import { config as dotenvConfig } from "dotenv";
import inquirer from "inquirer";
import ora from "ora";
import { getWalletKey } from "../../src/helpers/get-wallet-key";
import { swap } from "../../src/services/jito/swap";
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
    const { keypair } = await getWalletKey();
    spinner.succeed("Connected to Solana!");
    console.log("Wallet address:", keypair.publicKey.toString());

    while (true) {
      await displayWalletTokens(keypair.publicKey.toString());
      const swapDetails = await promptForSwapDetails();

      if (swapDetails === null) {
        console.log(chalk.red("Exiting..."));
        process.exit(0);
      }

      spinner.text = "Preparing transaction...";
      console.log(swapDetails);
      spinner.start();

      let result;
      if (swapDetails.type === "sell_percentage") {
        throw new Error(
          "Percentage-based selling not yet implemented with Jito"
        );
      } else {
        // Convertir les adresses en PublicKey pour Jito
        result = await swap(
          swapDetails.inputToken,
          swapDetails.outputToken,
          swapDetails.amount,
          Math.round(swapDetails.slippage * 100),
          5,
          keypair
        );
      }

      if (!result) {
        spinner.fail("Swap failed!");
        continue;
      }

      spinner.succeed("Swap transaction submitted!");

      await animateSwap();

      console.log(chalk.green("\n✨ Transaction Details:"));
      console.log(chalk.cyan("Signature:"), result.signature);
      console.log(chalk.cyan("Bundle Status:"), result.bundleStatus?.status);
      if (result.bundleStatus?.landedSlot) {
        console.log(chalk.cyan("Landed Slot:"), result.bundleStatus.landedSlot);
      }
      console.log(
        chalk.cyan("Explorer:"),
        `https://solscan.io/tx/${result.signature}`
      );

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
