export {
  MAGIC,
  VERSION,
  EncrypterError,
  type ContentType,
  type EncMetadata,
  type DecryptResult,
} from "./constants.js";

export { encryptBytes, decryptBytes, encOutputName } from "./format.js";
export { deriveKey } from "./kdf.js";
export {
  zipFolderEntries,
  unzipToEntries,
  buildMetadata,
} from "./zip.js";

import { encryptBytes, decryptBytes } from "./format.js";
import { buildMetadata, zipFolderEntries, unzipToEntries } from "./zip.js";
import type { EncMetadata } from "./constants.js";

export async function encryptFile(
  data: Uint8Array,
  password: string,
  originalName: string,
  mimeType = "application/octet-stream"
): Promise<Uint8Array> {
  const metadata = buildMetadata(
    originalName,
    "file",
    mimeType,
    1,
    data.byteLength
  );
  return encryptBytes(data, password, metadata);
}

export async function encryptFolder(
  entries: { path: string; data: Uint8Array }[],
  password: string,
  folderName: string
): Promise<Uint8Array> {
  const totalSize = entries.reduce((sum, e) => sum + e.data.byteLength, 0);
  const zipData = zipFolderEntries(entries, folderName);
  const metadata = buildMetadata(
    folderName,
    "folder",
    "application/zip",
    entries.length,
    totalSize
  );
  return encryptBytes(zipData, password, metadata);
}

export async function decryptPayload(
  encData: Uint8Array,
  password: string
): Promise<{
  metadata: EncMetadata;
  fileData?: Uint8Array;
  folderEntries?: { path: string; data: Uint8Array }[];
  folderName?: string;
}> {
  const { data, metadata } = await decryptBytes(encData, password);

  if (metadata.contentType === "folder") {
    const { folderName, entries } = unzipToEntries(data);
    return { metadata, folderEntries: entries, folderName };
  }

  return { metadata, fileData: data };
}
