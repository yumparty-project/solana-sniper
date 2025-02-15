import chalk from "chalk";
import ora from "ora";
import { SwapService } from "../../../src/services/jupiter/swap";

/**
 * Displays all tokens present in the user's wallet
 * @param swapService - The swap service instance to fetch wallet tokens
 */
export const displayWalletTokens = async (swapService: SwapService) => {
  const spinner = ora("Fetching wallet tokens...").start();
  try {
    const tokens = await swapService.getWalletTokens();
    spinner.succeed("Wallet tokens found!");

    if (tokens.length === 0) {
      console.log(chalk.yellow("\n💼 No tokens found in wallet"));
      return;
    }

    console.log(chalk.green("\n💼 Your Wallet Tokens:"));
    tokens.forEach((token, index) => {
      console.log(chalk.cyan(`\n${index + 1}. Token: ${token.mint}`));
      console.log(chalk.gray(`   Balance: ${token.balance}`));
    });
    console.log(); // Empty line for spacing
  } catch (error) {
    spinner.fail("Failed to fetch wallet tokens");
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
  }
};
