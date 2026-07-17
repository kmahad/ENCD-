import { useState, useRef, useEffect } from "react";
import Peer from "peerjs";
import { QRCodeSVG } from "qrcode.react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { DropZone } from "./components/DropZone";
import { ProgressBar } from "./components/ProgressBar";
import { downloadBlob, formatBytes, readFileAsBytes } from "./utils";

type Mode = "send" | "receive";

export function TransferPage() {
  const [mode, setMode] = useState<Mode>("receive");
  const [peerId, setPeerId] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  const [status, setStatus] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [transferProgress, setTransferProgress] = useState(0);
  const [receivedFile, setReceivedFile] = useState<{
    name: string;
    data: Blob;
  } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

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
            const blob = new Blob([fullData], {
              type: "application/octet-stream",
            });
            setReceivedFile({ name: fileName, data: blob });
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

  const handleSend = async () => {
    if (!connectionRef.current || files.length === 0) return;

    const file = files[0];
    const data = await readFileAsBytes(file);
    const chunkSize = 16384; // 16KB chunks
    const totalChunks = Math.ceil(data.length / chunkSize);

    setStatus(`Sending ${file.name}...`);

    // Send metadata first
    connectionRef.current.send(`fileName:${file.name}`);
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

  const handleReset = () => {
    setFiles([]);
    setStatus("");
    setTransferProgress(0);
    setReceivedFile(null);
    setRemotePeerId("");
    setShowScanner(false);
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
  };

  const startScanner = async () => {
    try {
      setShowScanner(true);
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      const result = await codeReader.decodeOnceFromVideoDevice(
        undefined,
        videoRef.current!,
      );
      if (result) {
        setRemotePeerId(result.getText());
        setShowScanner(false);
        codeReader.reset();
      }
    } catch (err) {
      console.error("QR scan error:", err);
      setStatus(
        "Error scanning QR code. Please try again or enter Peer ID manually.",
      );
      setShowScanner(false);
    }
  };

  const stopScanner = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setShowScanner(false);
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
          {peerId && (
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "white",
                padding: "1rem",
                borderRadius: "0.5rem",
              }}
            >
              <QRCodeSVG value={peerId} size={200} />
              <p
                className="status-text"
                style={{ color: "black", marginTop: "0.5rem" }}
              >
                Scan to connect
              </p>
            </div>
          )}
          {status && <p className="status-text">{status}</p>}
          {transferProgress > 0 && (
            <ProgressBar value={transferProgress} label="Receiving..." />
          )}
          {receivedFile && (
            <div style={{ marginTop: "1rem" }}>
              <p className="status-text">Received: {receivedFile.name}</p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() =>
                  downloadBlob(receivedFile.data, receivedFile.name)
                }
              >
                Download File
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
            {showScanner ? (
              <div style={{ marginBottom: "1rem" }}>
                <video
                  ref={videoRef}
                  style={{ width: "100%", borderRadius: "0.5rem" }}
                />
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={stopScanner}
                  style={{ marginTop: "0.5rem" }}
                >
                  Cancel Scan
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={startScanner}
                style={{ marginBottom: "1rem" }}
              >
                📷 Scan QR Code
              </button>
            )}
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
                directory={false}
                multiple={false}
                label="DRAG & DROP AN ENCRYPTED FILE HERE OR CLICK TO UPLOAD"
                hint="max 500MB, only encrypted files (.enc) recommended"
                onFiles={(picked: File[]) => setFiles(picked.slice(0, 1))}
                disabled={!connectionRef.current}
              />

              {files.length > 0 && (
                <div className="file-status">
                  <span className="status-text">
                    Ready: {files[0].name} — {formatBytes(files[0].size)}
                  </span>
                </div>
              )}

              {transferProgress > 0 && (
                <ProgressBar value={transferProgress} label="Sending..." />
              )}

              <div className="actions">
                <button
                  type="button"
                  className="btn btn--primary btn--lg encrypt-btn"
                  onClick={handleSend}
                  disabled={files.length === 0}
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
