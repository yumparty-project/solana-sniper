import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { CONFIG } from "../../config";
import { formatSwapResult } from "../../helpers/format";
import { getSolBalance, getSplTokenBalance } from "../../helpers/get-balance";
import { getTokenDecimals } from "../../helpers/get-token-decimals";
import {
  prepareTransaction,
  sendAndConfirmTransaction,
} from "../../helpers/transaction";
import { SellOptions, TokenInfo } from "../../types";
import { getQuote } from "./get-quote";
import { requestJupiterSwap } from "./request-swap";

/**
 * Service handling token swaps on Solana using Jupiter aggregator
 * @class SwapService
 */
export class SwapService {
  protected connection: Connection;
  protected walletPublicKey: PublicKey;
  protected keypair: Keypair;

  /**
   * Creates an instance of SwapService
   * @param {Connection} connection - Solana RPC connection
   * @param {Keypair} keypair - Wallet keypair for signing transactions
   */
  constructor(connection: Connection, keypair: Keypair) {
    this.connection = connection;
    this.keypair = keypair;
    this.walletPublicKey = keypair.publicKey;
  }

  /**
   * Executes a token swap operation
   * @param {Object} inputToken - Input token information
   * @param {string} inputToken.address - Input token address
   * @param {Object} outputToken - Output token information
   * @param {string} outputToken.address - Output token address
   * @param {number | "all"} amount - Amount to swap or "all" for entire balance
   * @param {number} [slippage=50] - Maximum allowed slippage in basis points (default: 50 = 0.5%)
   * @param {number} [takeProfitPercentage] - Optional take profit percentage
   * @param {number} [stopLossPercentage] - Optional stop loss percentage
   * @returns {Promise<Object>} Swap result with transaction details
   * @throws {Error} If swap validation or execution fails
   */
  async swapToken(
    inputToken: { address: string },
    outputToken: { address: string },
    amount: number | "all",
    slippage: number = 50,
    takeProfitPercentage?: number,
    stopLossPercentage?: number
  ): Promise<any> {
    try {
      const finalAmount = await this.validateAndGetAmount(inputToken, amount);
      const swapData = await this.getSwapData(
        inputToken,
        outputToken,
        finalAmount,
        slippage
      );

      const swapResult = await this.executeSwap(
        swapData,
        inputToken,
        outputToken
      );

      return swapResult;
    } catch (error) {
      this.handleSwapError(error);
      throw error;
    }
  }

  /**
   * Sells a specified percentage of token holdings
   * @param {SellOptions} options - Token sell options
   * @param {string} options.tokenAddress - Address of token to sell
   * @param {number} [options.percentage=100] - Percentage of holdings to sell (default: 100)
   * @param {number} [options.slippage=50] - Maximum allowed slippage in basis points
   * @param {number} [options.takeProfitPercentage] - Optional take profit percentage
   * @param {number} [options.stopLossPercentage] - Optional stop loss percentage
   * @returns {Promise<Object>} Sell transaction result
   * @throws {Error} If sell operation fails
   */
  async sellToken(options: SellOptions): Promise<any> {
    try {
      const {
        tokenAddress,
        percentage = 100,
        slippage = 50,
        takeProfitPercentage,
        stopLossPercentage,
      } = options;

      // Check token balance before selling
      const initialTokenBalance = await getSplTokenBalance(
        this.connection,
        this.walletPublicKey,
        tokenAddress
      );

      if (!initialTokenBalance || initialTokenBalance.uiAmount === 0) {
        throw new Error("No token balance found or balance is zero");
      }

      // Calculate amount to sell based on percentage
      const amountToSell =
        percentage === 100
          ? "all"
          : initialTokenBalance.uiAmount * (percentage / 100);

      console.log(
        `Selling ${percentage}% of ${initialTokenBalance.uiAmount} tokens`
      );

      // Execute the token sale
      const sellResult = await this.swapToken(
        { address: tokenAddress },
        { address: CONFIG.SOLANA_ADDRESS },
        amountToSell,
        slippage,
        takeProfitPercentage,
        stopLossPercentage
      );

      return sellResult;
    } catch (error) {
      console.error("Error in sellToken:", error);
      throw error;
    }
  }

  /**
   * Validates the input amount and returns the final amount to be used in the swap
   * @param inputToken - Token to be swapped
   * @param amount - Amount to swap or "all" to swap entire balance
   * @returns Final amount to be used in the swap
   */
  protected async validateAndGetAmount(
    inputToken: { address: string },
    amount: number | "all"
  ): Promise<number> {
    if (inputToken.address === CONFIG.SOLANA_ADDRESS) {
      return await this.validateSolAmount(amount);
    } else {
      return await this.validateTokenAmount(inputToken.address, amount);
    }
  }

  /**
   * Validates SOL amount against wallet balance
   * @param amount - Amount of SOL to validate or "all" for entire balance
   * @returns Validated SOL amount
   * @throws Error if insufficient balance
   */
  private async validateSolAmount(amount: number | "all"): Promise<number> {
    const { balance, uiBalance } = await getSolBalance(
      this.connection,
      this.walletPublicKey
    );

    if (amount === "all") {
      return uiBalance;
    }

    const lamportsNeeded = amount * 1e9;
    if (balance < lamportsNeeded) {
      throw new Error(
        `Insufficient balance. Current balance: ${uiBalance} SOL, required: ${amount} SOL`
      );
    }
    return amount;
  }

  /**
   * Validates token amount against wallet balance
   * @param tokenAddress - Address of token to validate
   * @param amount - Amount to validate or "all" for entire balance
   * @returns Validated token amount
   * @throws Error if insufficient balance or token account not found
   */
  private async validateTokenAmount(
    tokenAddress: string,
    amount: number | "all"
  ): Promise<number> {
    const tokenBalance = await getSplTokenBalance(
      this.connection,
      this.walletPublicKey,
      tokenAddress
    );

    if (!tokenBalance) {
      throw new Error("Token account not found");
    }

    const finalAmount = amount === "all" ? tokenBalance.uiAmount : amount;

    if (!tokenBalance.uiAmount || tokenBalance.uiAmount < finalAmount) {
      throw new Error(
        `Insufficient balance. Current balance: ${
          tokenBalance.uiAmount || 0
        } tokens, required: ${finalAmount} tokens`
      );
    }

    return finalAmount;
  }

  /**
   * Prepares swap data by getting quote and adjusting amounts
   * @param inputToken - Token to swap from
   * @param outputToken - Token to swap to
   * @param finalAmount - Amount to swap
   * @param slippage - Maximum allowed slippage
   * @returns Prepared swap data
   */
  protected async getSwapData(
    inputToken: { address: string },
    outputToken: { address: string },
    finalAmount: number,
    slippage: number
  ): Promise<any> {
    const decimals =
      inputToken.address === CONFIG.SOLANA_ADDRESS
        ? new BigNumber(9)
        : new BigNumber(
            await getTokenDecimals(this.connection, inputToken.address)
          );

    const adjustedAmount = new BigNumber(finalAmount).multipliedBy(
      new BigNumber(10).pow(decimals)
    );

    const quote = await getQuote(
      inputToken.address,
      outputToken.address,
      adjustedAmount.toNumber(),
      slippage
    );
    return await requestJupiterSwap(quote, this.walletPublicKey);
  }

  private async executeSwap(
    swapData: any,
    inputToken: { address: string },
    outputToken: { address: string }
  ): Promise<any> {
    const transaction = await this.prepareTransaction(swapData);
    const txid = await sendAndConfirmTransaction(this.connection, transaction);
    return this.formatSwapResult(
      txid,
      inputToken,
      outputToken,
      this.walletPublicKey.toString()
    );
  }

  /**
   * Handles swap-related errors and provides meaningful error messages
   * @param error - Error to handle
   * @throws Error with appropriate error message
   */
  protected handleSwapError(error: any): void {
    if (error instanceof Error) {
      if (
        error.message.includes("0x28") ||
        error.message.includes("insufficient funds")
      ) {
        throw new Error(
          "Insufficient funds to perform the swap. Please check your balance."
        );
      }
    }
    console.error("Error in swapToken:", error);
  }

  /**
   * Retrieves all tokens in the wallet with non-zero balance
   * @returns {Promise<TokenInfo[]>} Array of token information including account, mint address and balance
   * @throws {Error} If token fetching fails
   */
  async getWalletTokens(): Promise<TokenInfo[]> {
    try {
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        this.walletPublicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      return tokenAccounts.value
        .map((account) => {
          const parsedInfo = account.account.data.parsed.info;
          return {
            account: account.pubkey.toString(),
            mint: parsedInfo.mint,
            balance: parsedInfo.tokenAmount.uiAmount,
          };
        })
        .filter((token) => token.balance > 0);
    } catch (error) {
      console.error("Error fetching wallet tokens:", error);
      throw error;
    }
  }

  protected async prepareTransaction(
    swapData: any
  ): Promise<VersionedTransaction> {
    const transaction = prepareTransaction(swapData, [this.keypair]);
    return transaction;
  }

  protected formatSwapResult(
    txid: string,
    inputToken: { address: string },
    outputToken: { address: string },
    walletAddress: string
  ): any {
    return formatSwapResult(txid, inputToken, outputToken, walletAddress);
  }
}
