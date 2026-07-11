import { randomBytes } from "@noble/ciphers/webcrypto.js";
import {
  ARGON2_ITERATIONS,
  ARGON2_MEMORY_KIB,
  ARGON2_PARALLELISM,
  EncrypterError,
  MAGIC,
  NONCE_LENGTH,
  SALT_LENGTH,
  VERSION,
  type EncMetadata,
  type DecryptResult,
} from "./constants.js";
import { encryptAesGcm, decryptAesGcm } from "./cipher.js";
import { deriveKey } from "./kdf.js";

const HEADER_SIZE =
  MAGIC.length + 1 + SALT_LENGTH + NONCE_LENGTH + 4 + 1 + 4 + 1;

function writeUint32BE(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value, false);
}

function readUint32BE(view: DataView, offset: number): number {
  return view.getUint32(offset, false);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function encodeMetadata(metadata: EncMetadata): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(metadata));
}

function decodeMetadata(bytes: Uint8Array): EncMetadata {
  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as EncMetadata;
  if (!parsed.originalName || !parsed.contentType) {
    throw new EncrypterError("Invalid metadata", "CORRUPTED");
  }
  return parsed;
}

export async function encryptBytes(
  data: Uint8Array,
  password: string,
  metadata: EncMetadata
): Promise<Uint8Array> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt);

  const metaBytes = encodeMetadata(metadata);
  const metaEnc = encryptAesGcm(key, metaBytes);
  const payloadEnc = encryptAesGcm(key, data);

  const header = new Uint8Array(HEADER_SIZE);
  const view = new DataView(header.buffer);
  let offset = 0;

  header.set(MAGIC, offset);
  offset += MAGIC.length;
  header[offset++] = VERSION;
  header.set(salt, offset);
  offset += SALT_LENGTH;
  header.set(metaEnc.nonce, offset);
  offset += NONCE_LENGTH;
  writeUint32BE(view, offset, metaEnc.ciphertext.length);
  offset += 4;
  header[offset++] = ARGON2_MEMORY_KIB & 0xff;
  writeUint32BE(view, offset, ARGON2_ITERATIONS);
  offset += 4;
  header[offset++] = ARGON2_PARALLELISM;

  return concat(
    header,
    metaEnc.ciphertext,
    payloadEnc.nonce,
    payloadEnc.ciphertext
  );
}

export async function decryptBytes(
  encData: Uint8Array,
  password: string
): Promise<DecryptResult> {
  if (encData.length < HEADER_SIZE + NONCE_LENGTH + 16) {
    throw new EncrypterError("File is too small or corrupted", "INVALID_FORMAT");
  }

  if (!encData.slice(0, MAGIC.length).every((b, i) => b === MAGIC[i])) {
    throw new EncrypterError("Not a valid .enc file", "INVALID_FORMAT");
  }

  let offset = MAGIC.length;
  const version = encData[offset++];
  if (version !== VERSION) {
    throw new EncrypterError(
      `Unsupported version: ${version}`,
      "UNSUPPORTED_VERSION"
    );
  }

  const salt = encData.slice(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;
  const metaNonce = encData.slice(offset, offset + NONCE_LENGTH);
  offset += NONCE_LENGTH;

  const view = new DataView(encData.buffer, encData.byteOffset, encData.byteLength);
  const metaLen = readUint32BE(view, offset);
  offset += 4;
  offset += 1; // memory kib low byte (stored for compatibility)
  offset += 4; // iterations
  offset += 1; // parallelism

  const metaCipherStart = offset;
  const metaCipherEnd = metaCipherStart + metaLen;
  if (metaCipherEnd + NONCE_LENGTH > encData.length) {
    throw new EncrypterError("Corrupted encrypted file", "CORRUPTED");
  }

  const metaCiphertext = encData.slice(metaCipherStart, metaCipherEnd);
  const payloadNonce = encData.slice(metaCipherEnd, metaCipherEnd + NONCE_LENGTH);
  const payloadCiphertext = encData.slice(metaCipherEnd + NONCE_LENGTH);

  const key = await deriveKey(password, salt);

  let metadata: EncMetadata;
  try {
    const metaPlain = decryptAesGcm(key, metaCiphertext, metaNonce);
    metadata = decodeMetadata(metaPlain);
  } catch {
    throw new EncrypterError(
      "Wrong password or corrupted file",
      "WRONG_PASSWORD"
    );
  }

  let data: Uint8Array;
  try {
    data = decryptAesGcm(key, payloadCiphertext, payloadNonce);
  } catch {
    throw new EncrypterError(
      "Wrong password or corrupted file",
      "WRONG_PASSWORD"
    );
  }

  return { data, metadata };
}

export function encOutputName(originalName: string): string {
  const base = originalName.replace(/[/\\]/g, "_");
  return base.endsWith(".enc") ? base : `${base}.enc`;
}
