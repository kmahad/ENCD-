import { useState, useRef, useEffect } from "react";
import Peer from "peerjs";
import { DropZone } from "./components/DropZone";
import { ProgressBar } from "./components/ProgressBar";
import { formatBytes, downloadBlob } from "./utils";
import {
  pickFile,
  readFileBytes,
  saveDecryptedFile,
  writeFileBytes,
  getFileName,
  copyToClipboard,
  isTauri,
} from "./tauri";

type Mode = "send" | "receive";

export function TransferPage() {
  const [mode, setMode] = useState<Mode>("receive");
  const [peerId, setPeerId] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  const [status, setStatus] = useState("");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [transferProgress, setTransferProgress] = useState(0);
  const [receivedFile, setReceivedFile] = useState<{
    name: string;
    data: Uint8Array;
  } | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<any>(null);

  // Initialize Peer when in receive mode
  useEffect(() => {
    if (mode === "receive" && !peerRef.current) {
      const peer = new Peer();
      peerRef.current = peer;

      peer.on("open", (id) => {
        setPeerId(id);
        setStatus(
          "Waiting for connection... Share your Peer ID with the sender!",
        );
      });

      peer.on("connection", (conn) => {
        connectionRef.current = conn;
        setStatus("Connected! Receiving file...");

        let receivedChunks: Uint8Array[] = [];
        let fileName = "";
        let totalSize = 0;
        let receivedSize = 0;

        conn.on("data", (data: any) => {
          if (typeof data === "string" && data.startsWith("fileName:")) {
            fileName = data.split(":")[1];
            setStatus(`Receiving ${fileName}...`);
          } else if (
            typeof data === "string" &&
            data.startsWith("totalSize:")
          ) {
            totalSize = parseInt(data.split(":")[1]);
          } else if (data instanceof Uint8Array) {
            receivedChunks.push(data);
            receivedSize += data.length;
            setTransferProgress(Math.round((receivedSize / totalSize) * 100));
          } else if (data === "done") {
            const fullData = new Uint8Array(receivedSize);
            let offset = 0;
            for (const chunk of receivedChunks) {
              fullData.set(chunk, offset);
              offset += chunk.length;
            }
            setReceivedFile({ name: fileName, data: fullData });
            setStatus("File received!");
            setTransferProgress(100);
          }
        });

        conn.on("close", () => {
          setStatus("Connection closed.");
        });
      });

      peer.on("error", (err) => {
        setStatus(`Error: ${err.message}`);
      });
    }

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [mode]);

  const handleConnect = () => {
    if (!remotePeerId.trim()) return;

    if (!peerRef.current) {
      const peer = new Peer();
      peerRef.current = peer;
      peer.on("open", () => {
        connectToPeer();
      });
      peer.on("error", (err) => {
        setStatus(`Error: ${err.message}`);
      });
    } else {
      connectToPeer();
    }
  };

  const connectToPeer = () => {
    if (!peerRef.current) return;
    const conn = peerRef.current.connect(remotePeerId.trim());
    connectionRef.current = conn;
    setStatus("Connecting...");

    conn.on("open", () => {
      setStatus("Connected! Select a file to send.");
    });

    conn.on("error", (err: any) => {
      setStatus(`Error: ${err.message}`);
    });
  };

  const handlePickFile = async () => {
    const path = await pickFile();
    if (!path) return;
    setSelectedPath(path);
    const name = await getFileName(path);
    setDisplayName(name);
  };

  const handleDropPath = async (path: string) => {
    setSelectedPath(path);
    const name = await getFileName(path);
    setDisplayName(name);
  };

  const handleSend = async () => {
    if (!connectionRef.current || !selectedPath) return;

    const data = await readFileBytes(selectedPath);
    const chunkSize = 16384; // 16KB chunks
    const totalChunks = Math.ceil(data.length / chunkSize);

    setStatus(`Sending ${displayName}...`);

    // Send metadata first
    connectionRef.current.send(`fileName:${displayName}`);
    connectionRef.current.send(`totalSize:${data.length}`);

    // Send chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, data.length);
      const chunk = data.slice(start, end);
      connectionRef.current.send(chunk);
      setTransferProgress(Math.round(((i + 1) / totalChunks) * 100));
      // Small delay to avoid overwhelming the connection
      await new Promise((resolve) => setTimeout(resolve, 1));
    }

    connectionRef.current.send("done");
    setStatus("File sent!");
  };

  const handleSaveReceivedFile = async () => {
    if (!receivedFile) return;

    if (isTauri()) {
      try {
        const savePath = await saveDecryptedFile(
          receivedFile.name,
          receivedFile.name.split(".").pop() || "enc",
        );
        if (!savePath) return;
        await writeFileBytes(savePath, receivedFile.data);
        setStatus(`File saved to: ${savePath}`);
      } catch (err) {
        console.error("Failed to save file with Tauri:", err);
        setStatus("Failed to save file.");
      }
    } else {
      // Fall back to browser download when Tauri isn't available
      const blob = new Blob([receivedFile.data], {
        type: "application/octet-stream",
      });
      downloadBlob(blob, receivedFile.name);
      setStatus("File downloaded!");
    }
  };

  const handleReset = () => {
    setSelectedPath(null);
    setDisplayName("");
    setStatus("");
    setTransferProgress(0);
    setReceivedFile(null);
    setRemotePeerId("");
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
  };

  return (
    <section className="panel animate-fade-in">
      <div className="panel__title-area">
        <h2>Transfer Encrypted Files</h2>
        <p className="panel__subtitle">
          Peer-to-peer file transfer with end-to-end encryption
        </p>
      </div>

      <div className="mode-tabs">
        <button
          type="button"
          className={`mode-tab ${mode === "receive" ? "mode-tab--active" : ""}`}
          onClick={() => {
            setMode("receive");
            handleReset();
          }}
        >
          Receive
        </button>
        <button
          type="button"
          className={`mode-tab ${mode === "send" ? "mode-tab--active" : ""}`}
          onClick={() => {
            setMode("send");
            handleReset();
          }}
        >
          Send
        </button>
      </div>

      {mode === "receive" && (
        <div className="settings-card">
          <h3>Your Peer ID</h3>
          <p
            className="status-text"
            style={{
              wordBreak: "break-all",
              fontFamily: "monospace",
              background: "#1a1a2e",
              padding: "1rem",
              borderRadius: "0.5rem",
            }}
          >
            {peerId || "Generating..."}
          </p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              copyToClipboard(peerId);
              alert("Peer ID copied to clipboard!");
            }}
            disabled={!peerId}
          >
            📋 Copy Peer ID
          </button>
          {status && (
            <p className="status-text" style={{ marginTop: "1rem" }}>
              {status}
            </p>
          )}
          {transferProgress > 0 && (
            <ProgressBar value={transferProgress} label="Receiving..." />
          )}
          {receivedFile && (
            <div style={{ marginTop: "1rem" }}>
              <p className="status-text">Received: {receivedFile.name}</p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSaveReceivedFile}
              >
                Save File 💾
              </button>
            </div>
          )}
        </div>
      )}

      {mode === "send" && (
        <>
          <div className="settings-card">
            <h3>Enter Recipient's Peer ID</h3>
            <input
              type="text"
              value={remotePeerId}
              onChange={(e) => setRemotePeerId(e.target.value)}
              placeholder="Paste recipient's Peer ID here"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #2a2a4a",
                background: "#1a1a2e",
                color: "white",
                marginBottom: "1rem",
              }}
            />
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleConnect}
              disabled={!remotePeerId.trim()}
            >
              Connect
            </button>
            {status && (
              <p className="status-text" style={{ marginTop: "1rem" }}>
                {status}
              </p>
            )}
          </div>

          {connectionRef.current && (
            <>
              <DropZone
                label="DRAG & DROP AN ENCRYPTED FILE HERE OR CLICK TO CHOOSE"
                hint="Only encrypted files (.enc) recommended"
                onPick={handlePickFile}
                onDropPath={handleDropPath}
              />

              {selectedPath && (
                <div className="file-info">
                  <p>
                    <strong>{displayName}</strong>
                  </p>
                  <p className="file-info__path">{selectedPath}</p>
                </div>
              )}

              {transferProgress > 0 && (
                <ProgressBar value={transferProgress} label="Sending..." />
              )}

              <div className="actions">
                <button
                  type="button"
                  className="btn btn--primary encrypt-btn"
                  onClick={handleSend}
                  disabled={!selectedPath}
                >
                  Send File 📤
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={handleReset}
                >
                  Clear
                </button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
