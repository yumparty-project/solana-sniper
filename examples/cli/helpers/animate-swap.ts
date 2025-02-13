import ora from "ora";

/**
 * Displays an animation during the swap process
 * @returns Promise<boolean> - Returns true when animation completes
 */

export const animateSwap = async () => {
  const spinner = ora({
    text: "Processing swap transaction",
    color: "yellow",
  }).start();

  // Simulate a short delay to show the spinner
  await new Promise((resolve) => setTimeout(resolve, 1500));

  spinner.succeed("Transaction completed successfully! 🎉");
  return true;
};
