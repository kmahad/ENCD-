import { describe, it, expect } from "vitest";
import {
  encryptBytes,
  decryptBytes,
  encryptFile,
  encryptFolder,
  decryptPayload,
  buildMetadata,
  EncrypterError,
  encOutputName,
} from "./index.js";

describe("crypto-core", () => {
  const password = "test-password-12345";
  const sampleData = new TextEncoder().encode("Hello, encrypted world!");

  it("encrypts and decrypts a single file round-trip", async () => {
    const enc = await encryptFile(sampleData, password, "hello.txt", "text/plain");
    const result = await decryptPayload(enc, password);

    expect(result.metadata.originalName).toBe("hello.txt");
    expect(result.metadata.contentType).toBe("file");
    expect(result.fileData).toEqual(sampleData);
  });

  it("rejects wrong password", async () => {
    const enc = await encryptFile(sampleData, password, "hello.txt");
    await expect(decryptPayload(enc, "wrong-password")).rejects.toThrow(
      EncrypterError
    );
  });

  it("rejects invalid format", async () => {
    const garbage = new Uint8Array([1, 2, 3, 4]);
    await expect(decryptBytes(garbage, password)).rejects.toMatchObject({
      code: "INVALID_FORMAT",
    });
  });

  it("encrypts and decrypts a folder", async () => {
    const entries = [
      { path: "doc.txt", data: new TextEncoder().encode("doc content") },
      { path: "sub/img.bin", data: new Uint8Array([0, 1, 2, 3]) },
    ];
    const enc = await encryptFolder(entries, password, "my-folder");
    const result = await decryptPayload(enc, password);

    expect(result.metadata.contentType).toBe("folder");
    expect(result.metadata.fileCount).toBe(2);
    expect(result.folderEntries).toHaveLength(2);
    expect(result.folderEntries!.find((e) => e.path === "doc.txt")?.data).toEqual(
      entries[0].data
    );
  });

  it("produces deterministic structure with fixed metadata", async () => {
    const metadata = buildMetadata("test.bin", "file", "application/octet-stream", 1, 5);
    const enc = await encryptBytes(sampleData, password, metadata);
    expect(enc[0]).toBe("E".charCodeAt(0));
    expect(enc[1]).toBe("N".charCodeAt(0));
    expect(encOutputName("report.pdf")).toBe("report.pdf.enc");
  });
});
