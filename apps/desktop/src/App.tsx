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
          All encryption happens locally on your machine. AES-256-GCM + Argon2id.
          Compatible with the web version.
        </p>
      </footer>
    </div>
  );
}
