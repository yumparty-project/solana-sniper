import chalk from "chalk";
import ora from "ora";
import { getWalletTokens } from "../../../src/services/solana-tracker";

/**
 * Displays all tokens present in the user's wallet
 * @param walletAddress - The wallet address to fetch tokens
 */
export async function displayWalletTokens(walletAddress: string) {
  const spinner = ora("Fetching wallet tokens...").start();

  try {
    const tokens = await getWalletTokens(walletAddress);
    console.log(tokens);
    if (tokens.length === 0) {
      spinner.info("No tokens found in wallet");
      return;
    }

    spinner.succeed("Wallet tokens:");

    tokens.forEach((tokenInfo: any) => {
      console.log(
        chalk.cyan("\n🪙 Token:"),
        tokenInfo.token.name,
        chalk.gray(`(${tokenInfo.token.symbol})`),
        "\n   Balance:",
        chalk.yellow(tokenInfo.balance.toFixed(6)),
        "\n   Value:",
        chalk.green(`$${tokenInfo.value.toFixed(2)}`),
        "\n   Address:",
        chalk.gray(tokenInfo.token.mint)
      );
    });
  } catch (error) {
    spinner.fail("Failed to fetch wallet tokens");
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
  }
}
