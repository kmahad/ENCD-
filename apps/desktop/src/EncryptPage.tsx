import { useState } from "react";
import {
  encryptFile,
  encryptFolder,
  encOutputName,
  EncrypterError,
} from "@encrypter/crypto-core";
import { PasswordInput } from "./components/PasswordInput";
import { ProgressBar } from "./components/ProgressBar";
import { DropZone } from "./components/DropZone";
import { useAsync } from "./hooks/useAsync";
import { useActivity } from "./hooks/useActivity";
import {
  getFileName,
  pickFile,
  pickFolder,
  readFileBytes,
  readFolderEntries,
  saveEncFile,
  writeFileBytes,
  checkPath,
  openContainingFolder,
  copyToClipboard,
} from "./tauri";
import { generateSecureFilename } from "./utils";

type Mode = "file" | "folder";

export function EncryptPage() {
  const [mode, setMode] = useState<Mode>("file");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [fileCount, setFileCount] = useState(0);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureNames, setSecureNames] = useState(true);
  const [savedEncPath, setSavedEncPath] = useState<string | null>(null);

  const { addActivity, savePasswords, setSavePasswords } = useActivity();

  const { loading, error, progress, run, reset } = useAsync<{ path: string }>();

  const canEncrypt =
    selectedPath !== null &&
    password.length >= 8 &&
    password === confirmPassword &&
    !loading;

  const handlePick = async () => {
    const path = mode === "file" ? await pickFile() : await pickFolder();
    if (!path) return;
    setSelectedPath(path);
    const name = await getFileName(path);
    setDisplayName(name);
    if (mode === "folder") {
      const entries = await readFolderEntries(path);
      setFileCount(entries.length);
    } else {
      setFileCount(1);
    }
    reset();
  };

  const handleDropPath = async (path: string) => {
    try {
      const meta = await checkPath(path);
      if (meta.is_dir) {
        setMode("folder");
        setSelectedPath(path);
        const name = await getFileName(path);
        setDisplayName(name);
        const entries = await readFolderEntries(path);
        setFileCount(entries.length);
      } else {
        setMode("file");
        setSelectedPath(path);
        const name = await getFileName(path);
        setDisplayName(name);
        setFileCount(1);
      }
      reset();
    } catch (err) {
      console.error("Error processing dropped path", err);
    }
  };

  const handleEncrypt = () => {
    if (!selectedPath || !canEncrypt) return;

    run(async (onProgress: (p: number) => void) => {
      onProgress(10);

      let enc: Uint8Array;
      let outName: string;
      let totalSize = 0;

      if (mode === "file") {
        const data = await readFileBytes(selectedPath);
        totalSize = data.byteLength;
        onProgress(40);
        enc = await encryptFile(data, password, displayName);
        outName = secureNames
          ? generateSecureFilename()
          : encOutputName(displayName);
      } else {
        const entries = await readFolderEntries(selectedPath);
        totalSize = entries.reduce((sum, e) => sum + e.data.byteLength, 0);
        onProgress(30);
        enc = await encryptFolder(entries, password, displayName);
        onProgress(70);
        outName = secureNames
          ? generateSecureFilename()
          : encOutputName(displayName);
      }

      const savePath = await saveEncFile(outName);
      if (!savePath) throw new Error("Save cancelled");

      await writeFileBytes(savePath, enc);
      setSavedEncPath(savePath);

      // Log activity
      await addActivity(
        displayName,
        "encrypt",
        mode,
        totalSize,
        secureNames,
        password,
      );

      onProgress(100);
      return { path: savePath };
    }).catch(() => {});
  };

  const handleReset = () => {
    setSelectedPath(null);
    setDisplayName("");
    setFileCount(0);
    setPassword("");
    setConfirmPassword("");
    setSavedEncPath(null);
    reset();
  };

  return (
    <section className="panel animate-fade-in">
      <div className="panel__title-area">
        <h2>Encrypt Your Files</h2>
        <p className="panel__subtitle">
          Secure any file or folder with local AES-256-GCM encryption
        </p>
      </div>

      <div className="mode-tabs">
        <button
          type="button"
          className={`mode-tab ${mode === "file" ? "mode-tab--active" : ""}`}
          onClick={() => {
            setMode("file");
            handleReset();
          }}
        >
          Single file
        </button>
        <button
          type="button"
          className={`mode-tab ${mode === "folder" ? "mode-tab--active" : ""}`}
          onClick={() => {
            setMode("folder");
            handleReset();
          }}
        >
          Folder
        </button>
      </div>

      <DropZone
        label={
          mode === "file"
            ? "DRAG & DROP A FILE HERE OR CLICK TO CHOOSE"
            : "DRAG & DROP A FOLDER HERE OR CLICK TO CHOOSE"
        }
        hint={
          mode === "file"
            ? "Multiple file types supported"
            : "All subfolders/files will be zipped and encrypted"
        }
        onPick={handlePick}
        onDropPath={handleDropPath}
        disabled={loading}
      />

      {selectedPath && (
        <div className="file-info">
          <p>
            <strong>{displayName}</strong>
          </p>
          <p className="file-info__path">{selectedPath}</p>
          {mode === "folder" && (
            <p className="file-info__meta">{fileCount} files</p>
          )}
        </div>
      )}

      <div className="settings-card">
        <h3>Encryption Settings</h3>

        <div className="settings-indicators">
          <span
            className={`indicator ${selectedPath ? "indicator--done" : ""}`}
          >
            Files Added: {selectedPath ? "✓" : "✗"}
          </span>
          <span
            className={`indicator ${password.length >= 8 && password === confirmPassword ? "indicator--done" : ""}`}
          >
            Password:{" "}
            {password.length >= 8 && password === confirmPassword ? "✓" : "✗"}
          </span>
        </div>

        <PasswordInput
          password={password}
          confirmPassword={confirmPassword}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirmPassword}
          showConfirm
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
              <span className="toggle-hint">
                Locally encrypted under a browser-unique key and stored only on
                this device
              </span>
            </span>
          </label>
        </div>

        <div className="settings-options">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={secureNames}
              onChange={(e) => setSecureNames(e.target.checked)}
              className="toggle-checkbox"
              disabled={loading}
            />
            <span className="toggle-switch" />
            <span className="toggle-text">
              <strong>Secure Filenames</strong>
              <span className="toggle-hint">
                Obfuscates output name to protect confidentiality
              </span>
            </span>
          </label>
        </div>

        {selectedPath && (
          <div className="file-status">
            <span className="status-text">
              Ready: {mode === "file" ? "1 File" : `${fileCount} Files`}{" "}
              Selected ({displayName})
            </span>
          </div>
        )}
      </div>

      {loading && (
        <ProgressBar
          value={progress}
          label={
            mode === "folder"
              ? "Reading, zipping & encrypting…"
              : "Encrypting file…"
          }
        />
      )}

      {error && <p className="error-msg">{error}</p>}

      {savedEncPath && (
        <div className="settings-card">
          <h3>Transfer Encrypted File</h3>
          <div className="file-info">
            <p>
              <strong>Saved to:</strong>
            </p>
            <p className="file-info__path">{savedEncPath}</p>
          </div>
          <div className="actions" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={async () => {
                await openContainingFolder(savedEncPath);
              }}
            >
              📂 Open Folder
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={async () => {
                await copyToClipboard(savedEncPath);
                alert("File path copied to clipboard!");
              }}
            >
              📋 Copy Path
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleReset}
            >
              Encrypt Another
            </button>
          </div>
        </div>
      )}

      {!savedEncPath && (
        <div className="actions">
          <button
            type="button"
            className="btn btn--primary encrypt-btn"
            disabled={!canEncrypt}
            onClick={handleEncrypt}
          >
            {loading ? "Encrypting…" : "ENCRYPT & SAVE 🔒"}
          </button>
          {selectedPath && (
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
      )}
    </section>
  );
}

export function mapEncrypterError(err: any): string {
  if (err instanceof EncrypterError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
