import {
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

/**
 * Creates a versioned transaction with compute budget and priority fee
 * @param instructions - Array of instructions to include in the transaction
 * @param payer - Payer of the transaction
 * @param addressLookupTableAccounts - Address lookup table accounts
 * @param recentBlockhash - Recent blockhash for the transaction
 * @param computeUnits - Compute units for the transaction
 * @param priorityFee - Priority fee for the transaction
 * @returns Versioned transaction
 */
export function createVersionedTransaction(
  instructions: any,
  payer: any,
  addressLookupTableAccounts: any,
  recentBlockhash: any,
  computeUnits: any,
  priorityFee: any
) {
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: computeUnits,
  });
  const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: priorityFee.microLamports,
  });

  const finalInstructions = [computeBudgetIx, priorityFeeIx, ...instructions];

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: recentBlockhash,
    instructions: finalInstructions,
  }).compileToV0Message(addressLookupTableAccounts);

  return new VersionedTransaction(messageV0);
}
