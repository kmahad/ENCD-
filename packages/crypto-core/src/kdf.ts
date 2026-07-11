import { argon2id } from "hash-wasm";
import {
  ARGON2_ITERATIONS,
  ARGON2_MEMORY_KIB,
  ARGON2_PARALLELISM,
  KEY_LENGTH,
} from "./constants.js";

export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  const hashHex = await argon2id({
    password,
    salt,
    parallelism: ARGON2_PARALLELISM,
    iterations: ARGON2_ITERATIONS,
    memorySize: ARGON2_MEMORY_KIB,
    hashLength: KEY_LENGTH,
    outputType: "hex",
  });

  const key = new Uint8Array(KEY_LENGTH);
  for (let i = 0; i < KEY_LENGTH; i++) {
    key[i] = parseInt(hashHex.slice(i * 2, i * 2 + 2), 16);
  }
  return key;
}
