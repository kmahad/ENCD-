export const MAGIC = new TextEncoder().encode("ENC1");
export const VERSION = 1;
export const SALT_LENGTH = 16;
export const NONCE_LENGTH = 12;
export const KEY_LENGTH = 32;

/** Argon2id parameters (documented in header for future compatibility) */
export const ARGON2_MEMORY_KIB = 65536; // 64 MB
export const ARGON2_ITERATIONS = 3;
export const ARGON2_PARALLELISM = 1;

export type ContentType = "file" | "folder";

export interface EncMetadata {
  originalName: string;
  contentType: ContentType;
  mimeType: string;
  fileCount: number;
  uncompressedSize: number;
}

export interface DecryptResult {
  data: Uint8Array;
  metadata: EncMetadata;
}

export class EncrypterError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_FORMAT"
      | "UNSUPPORTED_VERSION"
      | "WRONG_PASSWORD"
      | "CORRUPTED"
  ) {
    super(message);
    this.name = "EncrypterError";
  }
}
