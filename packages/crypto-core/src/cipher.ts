import { gcm } from "@noble/ciphers/aes.js";
import { randomBytes } from "@noble/ciphers/webcrypto.js";
import { NONCE_LENGTH } from "./constants.js";

export function encryptAesGcm(
  key: Uint8Array,
  plaintext: Uint8Array,
  nonce?: Uint8Array
): { ciphertext: Uint8Array; nonce: Uint8Array } {
  const iv = nonce ?? randomBytes(NONCE_LENGTH);
  const aes = gcm(key, iv);
  const ciphertext = aes.encrypt(plaintext);
  return { ciphertext, nonce: iv };
}

export function decryptAesGcm(
  key: Uint8Array,
  ciphertext: Uint8Array,
  nonce: Uint8Array
): Uint8Array {
  const aes = gcm(key, nonce);
  return aes.decrypt(ciphertext);
}
