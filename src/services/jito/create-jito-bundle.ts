import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { CONFIG } from "../../config";
import { getTipAccounts } from "./get-tip-accounts";

/**
 * Creates a Jito bundle from a transaction
 * @param transaction - Transaction to bundle
 * @param wallet - Wallet to use for the bundle
 * @returns Array of encoded transactions
 */
export async function createJitoBundle(transaction: any, wallet: any) {
  try {
    const connection = new Connection(CONFIG.SOLANA_RPC);
    const tipAccounts = await getTipAccounts();
    if (!tipAccounts || tipAccounts.length === 0) {
      throw new Error("❌ Failed to get Jito tip accounts");
    }

    const tipAccountPubkey = new PublicKey(
      tipAccounts[Math.floor(Math.random() * tipAccounts.length)]
    );

    const tipInstruction = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: tipAccountPubkey,
      lamports: 10000,
    });

    const latestBlockhash = await connection.getLatestBlockhash("finalized");

    const tipTransaction = new Transaction().add(tipInstruction);
    tipTransaction.recentBlockhash = latestBlockhash.blockhash;
    tipTransaction.feePayer = wallet.publicKey;
    tipTransaction.sign(wallet);

    const signature = bs58.encode(transaction.signatures[0]);

    console.log("🔄 Encoding transactions...");
    const bundle = [tipTransaction, transaction].map((tx, index) => {
      console.log(`📦 Encoding transaction ${index + 1}`);
      if (tx instanceof VersionedTransaction) {
        console.log(`🔢 Transaction ${index + 1} is VersionedTransaction`);
        return bs58.encode(tx.serialize());
      } else {
        console.log(`📜 Transaction ${index + 1} is regular Transaction`);
        return bs58.encode(tx.serialize({ verifySignatures: false }));
      }
    });

    console.log("✅ Bundle created successfully");
    return bundle;
  } catch (error) {
    console.error(
      "❌ Error in createJitoBundle:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error;
  }
}
