import { useState } from "react";
import {
  encryptFile,
  encryptFolder,
  encOutputName,
  EncrypterError,
} from "@encrypter/crypto-core";
import { DropZone } from "./components/DropZone";
import { PasswordInput } from "./components/PasswordInput";
import { ProgressBar } from "./components/ProgressBar";
import { useAsync } from "./hooks/useAsync";
import { useActivity } from "./hooks/useActivity";
import { downloadBlob, formatBytes, readFileAsBytes, generateSecureFilename } from "./utils";

type Mode = "file" | "folder";

export function EncryptPage() {
  const [mode, setMode] = useState<Mode>("file");
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureNames, setSecureNames] = useState(true);
  
  const { addActivity, savePasswords, setSavePasswords } = useActivity();

  const { loading, error, progress, run, reset } = useAsync<{
    filename: string;
  }>();

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const canEncrypt =
    files.length > 0 &&
    password.length >= 8 &&
    password === confirmPassword &&
    !loading;

  const handleEncrypt = () => {
    if (!canEncrypt) return;

    run(async (onProgress: (p: number) => void) => {
      onProgress(5);

      if (mode === "file") {
        const file = files[0];
        onProgress(20);
        const data = await readFileAsBytes(file);
        onProgress(40);
        const enc = await encryptFile(
          data,
          password,
          file.name,
          file.type || "application/octet-stream"
        );
        onProgress(85);
        
        const filename = secureNames ? generateSecureFilename() : encOutputName(file.name);
        downloadBlob(new Blob([enc as any], { type: "application/octet-stream" }), filename);
        
        // Log activity
        await addActivity(file.name, "encrypt", "file", file.size, secureNames, password);
        
        onProgress(100);
        return { filename };
      }

      onProgress(10);
      const folderName =
        files[0].webkitRelativePath.split("/")[0] || "folder";
      const entries: { path: string; data: Uint8Array }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath =
          file.webkitRelativePath.split("/").slice(1).join("/") || file.name;
        entries.push({
          path: relativePath,
          data: await readFileAsBytes(file),
        });
        onProgress(10 + (50 * (i + 1)) / files.length);
      }

      const enc = await encryptFolder(entries, password, folderName);
      onProgress(85);
      
      const filename = secureNames ? generateSecureFilename() : encOutputName(folderName);
      downloadBlob(new Blob([enc as any], { type: "application/octet-stream" }), filename);
      
      // Log activity
      await addActivity(folderName, "encrypt", "folder", totalSize, secureNames, password);
      
      onProgress(100);
      return { filename };
    }).catch(() => {});
  };

  const handleReset = () => {
    setFiles([]);
    setPassword("");
    setConfirmPassword("");
    reset();
  };

  return (
    <section className="panel animate-fade-in">
      <div className="panel__title-area">
        <h2>Encrypt Your Files</h2>
        <p className="panel__subtitle">Secure any file or folder with client-side AES-256-GCM encryption</p>
      </div>

      <div className="mode-tabs">
        <button
          type="button"
          className={`mode-tab ${mode === "file" ? "mode-tab--active" : ""}`}
          onClick={() => {
            setMode("file");
            setFiles([]);
            reset();
          }}
        >
          Single file
        </button>
        <button
          type="button"
          className={`mode-tab ${mode === "folder" ? "mode-tab--active" : ""}`}
          onClick={() => {
            setMode("folder");
            setFiles([]);
            reset();
          }}
        >
          Folder
        </button>
      </div>

      <DropZone
        directory={mode === "folder"}
        multiple={mode === "folder"}
        label={
          mode === "file"
            ? "DRAG & DROP A FILE HERE OR CLICK TO UPLOAD"
            : "DRAG & DROP A FOLDER HERE OR CLICK TO UPLOAD"
        }
        hint={
          mode === "file"
            ? "max 500MB, multiple file types supported"
            : "max 500MB, all subfolders/files will be zipped and encrypted"
        }
        onFiles={(picked: File[]) => setFiles(mode === "file" ? picked.slice(0, 1) : picked)}
        disabled={loading}
      />

      <div className="settings-card">
        <h3>Encryption Settings</h3>
        
        <div className="settings-indicators">
          <span className={`indicator ${files.length > 0 ? "indicator--done" : ""}`}>
            Files Added: {files.length > 0 ? "✓" : "✗"}
          </span>
          <span className={`indicator ${password.length >= 8 && password === confirmPassword ? "indicator--done" : ""}`}>
            Password: {password.length >= 8 && password === confirmPassword ? "✓" : "✗"}
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
              <span className="toggle-hint">Locally encrypted under a browser-unique key and stored only on this device</span>
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
              <span className="toggle-hint">Obfuscates download filename to protect confidentiality</span>
            </span>
          </label>
        </div>

        {files.length > 0 && (
          <div className="file-status">
            {mode === "file" ? (
              <span className="status-text">
                Ready: 1 File Selected ({files[0].name} — {formatBytes(files[0].size)})
              </span>
            ) : (
              <span className="status-text">
                Ready: {files.length} Files Selected ({files[0].webkitRelativePath.split("/")[0] || "folder"} — {formatBytes(totalSize)})
              </span>
            )}
          </div>
        )}
      </div>

      {loading && (
        <ProgressBar
          value={progress}
          label={mode === "folder" ? "Zipping and encrypting…" : "Encrypting file…"}
        />
      )}

      {error && <p className="error-msg">{error}</p>}

      <div className="actions">
        <button
          type="button"
          className="btn btn--primary btn--lg encrypt-btn"
          disabled={!canEncrypt}
          onClick={handleEncrypt}
        >
          {loading ? "Encrypting…" : "ENCRYPT & DOWNLOAD 🔒"}
        </button>
        {(files.length > 0 || password) && (
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
    </section>
  );
}

export function mapEncrypterError(err: any): string {
  if (err instanceof EncrypterError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
