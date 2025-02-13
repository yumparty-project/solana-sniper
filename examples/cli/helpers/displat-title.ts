import chalk from "chalk";
import figlet from "figlet";

/**
 * Displays the application title and welcome message using ASCII art
 */
export const displayTitle = () => {
  console.clear();
  console.log(
    chalk.yellow(
      figlet.textSync("Solana Swap", {
        font: "Standard",
        horizontalLayout: "full",
      })
    )
  );
  console.log(
    chalk.blue("\n🚀 Welcome to the most awesome Solana Token Swapper! 🌙\n")
  );
};
