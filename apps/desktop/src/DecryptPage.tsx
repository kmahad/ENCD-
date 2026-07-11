import { useState } from "react";
import { decryptPayload, EncrypterError } from "@encrypter/crypto-core";
import { PasswordInput } from "./components/PasswordInput";
import { ProgressBar } from "./components/ProgressBar";
import { DropZone } from "./components/DropZone";
import { useAsync } from "./hooks/useAsync";
import { useActivity } from "./hooks/useActivity";
import { mapEncrypterError } from "./EncryptPage";
import {
  getFileName,
  pickEncFile,
  pickOutputFolder,
  readFileBytes,
  saveDecryptedFile,
  writeFileBytes,
  writeFolderEntries,
  checkPath,
} from "./tauri";

export function DecryptPage() {
  const [encPath, setEncPath] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { addActivity, savePasswords, setSavePasswords } = useActivity();
  const { loading, error, progress, run, reset } = useAsync<{ path: string }>();

  const canDecrypt = encPath !== null && password.length >= 1 && !loading;

  const handlePick = async () => {
    setValidationError(null);
    const path = await pickEncFile();
    if (!path) return;
    setEncPath(path);
    setDisplayName(await getFileName(path));
    reset();
  };

  const handleDropPath = async (path: string) => {
    setValidationError(null);
    try {
      const meta = await checkPath(path);
      if (meta.is_dir) {
        setValidationError("Cannot decrypt a folder directly. Please select the encrypted .enc file.");
        return;
      }
      if (!path.toLowerCase().endsWith(".enc")) {
        setValidationError("Please select a file ending in .enc.");
        return;
      }
      setEncPath(path);
      setDisplayName(await getFileName(path));
      reset();
    } catch (err) {
      console.error("Error processing dropped path", err);
    }
  };

  const handleDecrypt = () => {
    if (!encPath || !canDecrypt) return;

    run(async (onProgress: (p: number) => void) => {
      onProgress(10);
      const encData = await readFileBytes(encPath);
      onProgress(30);

      let result;
      try {
        result = await decryptPayload(encData, password);
      } catch (err) {
        throw new Error(mapEncrypterError(err));
      }

      onProgress(60);

      const isSecureName = displayName !== result.metadata.originalName && displayName.startsWith("enc_");

      if (result.metadata.contentType === "folder" && result.folderEntries) {
        const outputDir = await pickOutputFolder();
        if (!outputDir) throw new Error("Save cancelled");

        const folderName =
          result.folderName || result.metadata.originalName;
        const written = await writeFolderEntries(
          outputDir,
          folderName,
          result.folderEntries
        );
        
        // Log activity
        await addActivity(folderName, "decrypt", "folder", result.metadata.uncompressedSize, isSecureName, password);
        
        onProgress(100);
        return { path: written };
      }

      if (!result.fileData) {
        throw new EncrypterError("No data in decrypted file", "CORRUPTED");
      }

      const name = result.metadata.originalName;
      const ext = name.includes(".") ? name.split(".").pop()! : "bin";
      const savePath = await saveDecryptedFile(name, ext);
      if (!savePath) throw new Error("Save cancelled");

      await writeFileBytes(savePath, result.fileData);
      
      // Log activity
      await addActivity(name, "decrypt", "file", result.metadata.uncompressedSize, isSecureName, password);
      
      onProgress(100);
      return { path: savePath };
    }).catch(() => {});
  };

  const handleReset = () => {
    setEncPath(null);
    setDisplayName("");
    setPassword("");
    setValidationError(null);
    reset();
  };

  return (
    <section className="panel animate-fade-in">
      <div className="panel__title-area">
        <h2>Decrypt Your Files</h2>
        <p className="panel__subtitle">Restore your encrypted files or folders using the correct password</p>
      </div>

      <DropZone
        label="DRAG & DROP A .enc FILE HERE OR CLICK TO CHOOSE"
        hint="Please select the encrypted file to restore its contents"
        onPick={handlePick}
        onDropPath={handleDropPath}
        disabled={loading}
      />

      {encPath && (
        <div className="file-info">
          <p>
            <strong>{displayName}</strong>
          </p>
          <p className="file-info__path">{encPath}</p>
        </div>
      )}

      <PasswordInput
        password={password}
        onPasswordChange={setPassword}
        disabled={loading}
      />

      <div className="settings-options">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={savePasswords}
            onChange={(e) => setSavePasswords(e.target.checked)}
            className="toggle-checkbox"
            disabled={loading}
          />
          <span className="toggle-switch" />
          <span className="toggle-text">
            <strong>Save Password in Activity Log</strong>
            <span className="toggle-hint">Locally encrypted under a browser-unique key and stored only on this device</span>
          </span>
        </label>
      </div>

      {loading && <ProgressBar value={progress} label="Decrypting files…" />}

      {(error || validationError) && <p className="error-msg">{error || validationError}</p>}

      <div className="actions">
        <button
          type="button"
          className="btn btn--primary decrypt-btn"
          disabled={!canDecrypt}
          onClick={handleDecrypt}
        >
          {loading ? "Decrypting…" : "DECRYPT & SAVE 🔓"}
        </button>
        {encPath && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleReset}
            disabled={loading}
          >
            Clear
          </button>
        )}
      </div>

      <p className="tip">
        Folders are restored directly to the output folder you choose. Files are saved
        with their original name.
      </p>
    </section>
  );
}
