import { PublicKey } from "@solana/web3.js";

/**
 * Deserializes a serialized instruction
 * @param instruction - Serialized instruction
 * @returns Deserialized instruction
 */
export function deserializeInstruction(instruction: any) {
  return {
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((key: any) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instruction.data, "base64"),
  };
}
