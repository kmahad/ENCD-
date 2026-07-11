import { useState, useEffect } from "react";
import { EncryptPage } from "./EncryptPage";
import { DecryptPage } from "./DecryptPage";
import { ActivityPage } from "./ActivityPage";
import { HelpPage } from "./HelpPage";

type Page = "dashboard" | "activity" | "help";
type SubTab = "encrypt" | "decrypt";
type OS = "windows" | "macos" | "linux" | "other";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [subTab, setSubTab] = useState<SubTab>("encrypt");
  const [userOS, setUserOS] = useState<OS>("windows");

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes("win")) {
      setUserOS("windows");
    } else if (ua.includes("mac")) {
      setUserOS("macos");
    } else if (ua.includes("linux")) {
      setUserOS("linux");
    } else {
      setUserOS("other");
    }
  }, []);

  const getDownloadLink = (os: OS) => {
    switch (os) {
      case "windows":
        return "./downloads/Securitas_File_Lock_Setup.exe";
      case "macos":
        return "./downloads/Securitas_File_Lock.dmg";
      case "linux":
        return "./downloads/Securitas_File_Lock.deb";
      default:
        return "./downloads/Securitas_File_Lock_Setup.exe";
    }
  };

  const getOSLabel = (os: OS) => {
    switch (os) {
      case "windows":
        return "Download for Windows";
      case "macos":
        return "Download for macOS";
      case "linux":
        return "Download for Linux";
      default:
        return "Download Desktop App";
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header__brand">
          <span className="header__brand-main">SECURITAS</span>
          <span className="header__brand-divider">|</span>
          <span className="header__brand-sub">File Lock</span>
        </div>

        <nav className="header__nav">
          <button
            type="button"
            className={`nav-link ${page === "dashboard" ? "nav-link--active" : ""}`}
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`nav-link ${page === "activity" ? "nav-link--active" : ""}`}
            onClick={() => setPage("activity")}
          >
            Activity
          </button>
          <button
            type="button"
            className={`nav-link ${page === "help" ? "nav-link--active" : ""}`}
            onClick={() => setPage("help")}
          >
            Help
          </button>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <a
            href={getDownloadLink(userOS)}
            download
            className="btn btn--secondary btn--sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.8rem",
              fontSize: "0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--border-focus)",
              background: "rgba(0, 210, 255, 0.08)",
              color: "#00d2ff",
              textDecoration: "none",
              fontWeight: 600,
              transition: "all 0.2s ease"
            }}
          >
            📥 {getOSLabel(userOS)}
          </a>

          <div className="profile-badge">
            <div className="profile-avatar">
              <span className="profile-icon">👤</span>
              <span className="online-dot" />
            </div>
            <span className="profile-status">Online</span>
          </div>
        </div>
      </header>

      {page === "dashboard" && (
        <nav className="tabs">
          <button
            type="button"
            className={`tab ${subTab === "encrypt" ? "tab--active" : ""}`}
            onClick={() => setSubTab("encrypt")}
          >
            Encrypt
          </button>
          <button
            type="button"
            className={`tab ${subTab === "decrypt" ? "tab--active" : ""}`}
            onClick={() => setSubTab("decrypt")}
          >
            Decrypt
          </button>
        </nav>
      )}

      <main className="main">
        {page === "dashboard" && (subTab === "encrypt" ? <EncryptPage /> : <DecryptPage />)}
        {page === "activity" && <ActivityPage />}
        {page === "help" && <HelpPage />}
      </main>

      <footer className="footer">
        <p>
          Files never leave your device. All encryption happens locally in your
          browser using AES-256-GCM and Argon2id.
        </p>
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <p className="footer__sub" style={{ margin: 0 }}>
            For very large folders (&gt;500 MB), download and install our native desktop application.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="./downloads/Securitas_File_Lock_Setup.exe"
              download
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background: "linear-gradient(90deg, rgba(0, 210, 255, 0.1) 0%, rgba(168, 0, 255, 0.1) 100%)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              🏁 Windows (.exe)
            </a>
            <a
              href="./downloads/Securitas_File_Lock.dmg"
              download
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background: "linear-gradient(90deg, rgba(0, 210, 255, 0.1) 0%, rgba(168, 0, 255, 0.1) 100%)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              🍎 macOS (.dmg)
            </a>
            <a
              href="./downloads/Securitas_File_Lock.deb"
              download
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background: "linear-gradient(90deg, rgba(0, 210, 255, 0.1) 0%, rgba(168, 0, 255, 0.1) 100%)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              🐧 Linux (.deb)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
