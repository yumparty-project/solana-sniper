import inquirer, { DistinctQuestion } from "inquirer";
import { CONFIG } from "../../../src/config";
import { SwapDetails } from "../../../src/types";

/**
 * Prompts the user for swap details through an interactive CLI
 * @returns Promise<SwapDetails | null> - The swap configuration or null if cancelled
 */
export const promptForSwapDetails = async (): Promise<SwapDetails | null> => {
  const questions: DistinctQuestion[] = [
    {
      type: "list",
      name: "swapType",
      message: "What would you like to do?",
      choices: ["Buy with SOL", "Sell for SOL", "Sell Percentage", "Exit"],
    },
    {
      type: "input",
      name: "tokenAddress",
      message: "Enter the token address:",
      when: (answers: any) => answers.swapType !== "Exit",
      validate: (input: string) => {
        return input.length > 0 || "Please enter a valid token address";
      },
    },
    {
      type: "input",
      name: "percentage",
      message: "Enter percentage to sell (1-100):",
      when: (answers: any) => answers.swapType === "Sell Percentage",
      validate: (input: string) => {
        const num = parseFloat(input);
        return (
          (!isNaN(num) && num > 0 && num <= 100) ||
          "Please enter a valid percentage between 1 and 100"
        );
      },
    },
    {
      type: "list",
      name: "amountType",
      message: "How much would you like to swap?",
      when: (answers: any) =>
        answers.swapType !== "Sell Percentage" && answers.swapType !== "Exit",
      choices: ["Specific Amount", "All Balance", "Cancel"],
    },
    {
      type: "input",
      name: "amount",
      message: "Enter the amount:",
      when: (answers: any) => answers.amountType === "Specific Amount",
      validate: (input: string) => {
        const num = parseFloat(input);
        return (!isNaN(num) && num > 0) || "Please enter a valid number";
      },
    },
    {
      type: "input",
      name: "slippage",
      message: "Enter slippage tolerance (%):",
      when: (answers: any) => answers.swapType !== "Exit",
      default: "0.5",
      validate: (input: string) => {
        const num = parseFloat(input);
        return (
          (!isNaN(num) && num > 0 && num <= 100) ||
          "Please enter a valid percentage between 0 and 100"
        );
      },
    },
  ] as const;

  const answers = await inquirer.prompt(questions);

  if (answers.swapType === "Exit" || answers.amountType === "Cancel") {
    return null;
  }

  if (answers.swapType === "Sell Percentage") {
    return {
      type: "sell_percentage",
      tokenAddress: answers.tokenAddress,
      percentage: parseFloat(answers.percentage),
      slippage: parseFloat(answers.slippage || "0.5"),
    } as SwapDetails;
  }

  return {
    inputToken:
      answers.swapType === "Buy with SOL"
        ? CONFIG.SOLANA_ADDRESS
        : answers.tokenAddress,
    outputToken:
      answers.swapType === "Buy with SOL"
        ? answers.tokenAddress
        : CONFIG.SOLANA_ADDRESS,
    amount:
      answers.amountType === "All Balance" ? "all" : parseFloat(answers.amount),
    slippage: parseFloat(answers.slippage),
  } as SwapDetails;
};
