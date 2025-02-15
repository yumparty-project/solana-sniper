import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
} from "@solana/web3.js";
import { CONFIG } from "../config";

/**
 * Retrieves address lookup table accounts from the Solana RPC
 * @param keys - Array of public keys to fetch lookup table accounts for
 * @returns Array of address lookup table accounts
 */
export async function getAddressLookupTableAccounts(keys: any) {
  const connection = new Connection(CONFIG.SOLANA_RPC);

  const addressLookupTableAccounts = await Promise.all(
    keys.map(async (key: any) => {
      const accountInfo = await connection.getAccountInfo(new PublicKey(key));
      return {
        key: new PublicKey(key),
        state: accountInfo
          ? AddressLookupTableAccount.deserialize(accountInfo.data)
          : null,
      };
    })
  );
  return addressLookupTableAccounts.filter((account) => account.state !== null);
}
