import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function pickFile(): Promise<string | null> {
  const path = await open({
    multiple: false,
    directory: false,
  });
  return typeof path === "string" ? path : null;
}

export async function pickFolder(): Promise<string | null> {
  const path = await open({
    multiple: false,
    directory: true,
  });
  return typeof path === "string" ? path : null;
}

export async function pickEncFile(): Promise<string | null> {
  const path = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "Encrypted", extensions: ["enc"] }],
  });
  return typeof path === "string" ? path : null;
}

export async function saveEncFile(suggestedName: string): Promise<string | null> {
  const path = await save({
    defaultPath: suggestedName,
    filters: [{ name: "Encrypted", extensions: ["enc"] }],
  });
  return path;
}

export async function saveDecryptedFile(
  suggestedName: string,
  extension: string
): Promise<string | null> {
  const path = await save({
    defaultPath: suggestedName,
    filters: [{ name: "File", extensions: [extension] }],
  });
  return path;
}

export async function pickOutputFolder(): Promise<string | null> {
  const path = await open({
    multiple: false,
    directory: true,
  });
  return typeof path === "string" ? path : null;
}

export async function readFileBytes(path: string): Promise<Uint8Array> {
  const data = await invoke<number[]>("read_file_bytes", { path });
  return new Uint8Array(data);
}

export async function writeFileBytes(path: string, data: Uint8Array): Promise<void> {
  await invoke("write_file_bytes", { path, data: Array.from(data) });
}

export interface FolderEntry {
  path: string;
  data: number[];
}

export async function readFolderEntries(
  folderPath: string
): Promise<{ path: string; data: Uint8Array }[]> {
  const entries = await invoke<FolderEntry[]>("read_folder_entries", {
    folderPath,
  });
  return entries.map((e) => ({
    path: e.path,
    data: new Uint8Array(e.data),
  }));
}

export async function writeFolderEntries(
  outputDir: string,
  folderName: string,
  entries: { path: string; data: Uint8Array }[]
): Promise<string> {
  return invoke<string>("write_folder_entries", {
    outputDir,
    folderName,
    entries: entries.map((e) => ({
      path: e.path,
      data: Array.from(e.data),
    })),
  });
}

export async function getFileName(path: string): Promise<string> {
  return invoke<string>("get_file_name", { path });
}

export async function checkPath(path: string): Promise<{ path: string; is_dir: boolean }> {
  return invoke("check_path", { path });
}
