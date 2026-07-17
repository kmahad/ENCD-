import { useState, useEffect } from "react";
import { EncryptPage } from "./EncryptPage";
import { DecryptPage } from "./DecryptPage";
import { TransferPage } from "./TransferPage";
import { ActivityPage } from "./ActivityPage";
import { HelpPage } from "./HelpPage";
import { CursorLight } from "./components/CursorLight";
import { trackPageView } from "./analytics";

type Page = "dashboard" | "activity" | "help";
type SubTab = "encrypt" | "decrypt" | "transfer";
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

  useEffect(() => {
    if (page === "dashboard") {
      trackPageView(`/dashboard/${subTab}`, `Securitas File Lock - ${subTab}`);
      return;
    }

    trackPageView(`/${page}`, `Securitas File Lock - ${page}`);
  }, [page, subTab]);

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
    <>
      <CursorLight />
      <div className="bg-orb bg-orb--1" />
      <div className="bg-orb bg-orb--2" />
      <div className="bg-orb bg-orb--3" />
      <div className="app">
        <header className="header">
          <div className="header__container container">
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
                className="download-btn-nav"
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
          </div>
        </header>

        <div className="main-content">
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
              <button
                type="button"
                className={`tab ${subTab === "transfer" ? "tab--active" : ""}`}
                onClick={() => setSubTab("transfer")}
              >
                Transfer
              </button>
            </nav>
          )}

          <main className="main">
            {page === "dashboard" &&
              (subTab === "encrypt" ? (
                <EncryptPage />
              ) : subTab === "decrypt" ? (
                <DecryptPage />
              ) : (
                <TransferPage />
              ))}
            {page === "activity" && <ActivityPage />}
            {page === "help" && <HelpPage />}
          </main>
        </div>

        <footer className="footer">
          <div className="footer__container container">
            <div className="footer__brand-info">
              <span className="footer__brand-title">SECURITAS</span>
              <p className="footer__brand-desc">
                High-performance, zero-knowledge file and folder encryption. All
                cryptographic operations happen directly on your CPU using local
                resources. Your data never gets uploaded to any server.
              </p>
            </div>

            <div className="footer__links-section">
              <span className="footer__links-title">Download Desktop Apps</span>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <a
                  href="./downloads/Securitas_File_Lock_Setup.exe"
                  download
                  className="download-btn-footer"
                >
                  🏁 Windows (.exe)
                </a>
                <a
                  href="./downloads/Securitas_File_Lock.dmg"
                  download
                  className="download-btn-footer"
                >
                  🍎 macOS (.dmg)
                </a>
                <a
                  href="./downloads/Securitas_File_Lock.deb"
                  download
                  className="download-btn-footer"
                >
                  🐧 Linux (.deb)
                </a>
              </div>
            </div>
          </div>

          <div className="footer__bottom container">
            <p className="footer__copyright">
              © {new Date().getFullYear()} Securitas File Lock. Released under
              MIT License.
            </p>
            <p className="footer__badge-note">
              🔒 Local Cryptography (AES-256-GCM + Argon2id)
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
