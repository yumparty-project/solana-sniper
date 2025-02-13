export type SellOptions = {
  tokenAddress: string;
  percentage?: number; // si non fourni, vend 100%
  slippage?: number; // slippage en bps (1 = 0.01%)
  takeProfitPercentage?: number;
  stopLossPercentage?: number;
};

export type TokenInfo = {
  account: string;
  mint: string;
  balance: number;
};

export type TokenBalance = {
  amount: number;
  decimals: number;
  uiAmount: number;
};

export type SwapDetails = {
  inputToken: string;
  outputToken: string;
  amount: number | "all";
  slippage: number;
  type?: string;
  tokenAddress: string;
  percentage?: number;
  takeProfitPercentage?: number;
  stopLossPercentage?: number;
};

export type JupiterQuoteResponse = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
  contextSlot: number;
};
