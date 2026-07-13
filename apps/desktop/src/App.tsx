import { useState } from "react";
import { EncryptPage } from "./EncryptPage";
import { DecryptPage } from "./DecryptPage";
import { ActivityPage } from "./ActivityPage";
import { HelpPage } from "./HelpPage";

type Page = "dashboard" | "activity" | "help";
type SubTab = "encrypt" | "decrypt";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [subTab, setSubTab] = useState<SubTab>("encrypt");

  return (
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

          <div className="profile-badge">
            <div className="profile-avatar">
              <span className="profile-icon">💻</span>
              <span className="online-dot" />
            </div>
            <span className="profile-status">Local</span>
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
          </nav>
        )}

        <main className="main">
          {page === "dashboard" && (subTab === "encrypt" ? <EncryptPage /> : <DecryptPage />)}
          {page === "activity" && <ActivityPage />}
          {page === "help" && <HelpPage />}
        </main>
      </div>

      <footer className="footer">
        <div className="footer__container container">
          <div className="footer__brand-info">
            <span className="footer__brand-title">SECURITAS</span>
            <p className="footer__brand-desc">
              Native desktop encryption with zero-knowledge architecture.
              All cryptographic operations run locally on your machine.
              Compatible with the web version.
            </p>
          </div>
        </div>

        <div className="footer__bottom container">
          <p className="footer__copyright">
            © {new Date().getFullYear()} Securitas File Lock. Released under MIT License.
          </p>
          <p className="footer__badge-note">
            🔒 Local Cryptography (AES-256-GCM + Argon2id)
          </p>
        </div>
      </footer>
    </div>
  );
}
