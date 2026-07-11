import { zipSync, unzipSync, type Zippable } from "fflate";
import type { EncMetadata } from "./constants.js";

export function zipFolderEntries(
  entries: { path: string; data: Uint8Array }[],
  folderName: string
): Uint8Array {
  const archive: Zippable = {};
  const prefix = folderName.replace(/\/$/, "") + "/";

  for (const { path, data } of entries) {
    const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
    archive[`${prefix}${normalized}`] = data;
  }

  return zipSync(archive, { level: 6 });
}

export function unzipToEntries(zipData: Uint8Array): {
  folderName: string;
  entries: { path: string; data: Uint8Array }[];
} {
  const unzipped = unzipSync(zipData);
  const paths = Object.keys(unzipped).filter((p) => !p.endsWith("/"));

  if (paths.length === 0) {
    return { folderName: "folder", entries: [] };
  }

  const first = paths[0];
  const slashIdx = first.indexOf("/");
  const folderName = slashIdx > 0 ? first.slice(0, slashIdx) : "folder";

  const entries = paths.map((fullPath) => {
    const relative = slashIdx > 0 ? fullPath.slice(slashIdx + 1) : fullPath;
    return { path: relative, data: unzipped[fullPath] };
  });

  return { folderName, entries };
}

export function buildMetadata(
  originalName: string,
  contentType: EncMetadata["contentType"],
  mimeType: string,
  fileCount: number,
  uncompressedSize: number
): EncMetadata {
  return {
    originalName,
    contentType,
    mimeType,
    fileCount,
    uncompressedSize,
  };
}
