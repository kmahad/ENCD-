import { useState } from "react";
import { useActivity } from "./hooks/useActivity";
import { formatBytes, formatDate } from "./utils";

export function ActivityPage() {
  const {
    activities,
    clearActivities,
    decryptPassword,
  } = useActivity();

  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const handleReveal = async (id: string, encryptedPassword: string) => {
    if (revealedPasswords[id]) {
      const updated = { ...revealedPasswords };
      delete updated[id];
      setRevealedPasswords(updated);
      return;
    }

    try {
      const dec = await decryptPassword(encryptedPassword);
      setRevealedPasswords({ ...revealedPasswords, [id]: dec });
    } catch (e) {
      console.error(e);
      alert("Failed to decrypt password. The encryption key might have changed.");
    }
  };

  const handleCopy = async (id: string, encryptedPassword: string) => {
    try {
      const dec = await decryptPassword(encryptedPassword);
      await navigator.clipboard.writeText(dec);
      setCopyingId(id);
      setTimeout(() => setCopyingId(null), 1500);
    } catch (e) {
      console.error(e);
      alert("Failed to copy password.");
    }
  };

  return (
    <div className="panel animate-fade-in">
      <div className="activity-header">
        <h2>Activity History</h2>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => {
            if (confirm("Are you sure you want to clear your local activity history?")) {
              clearActivities();
            }
          }}
          disabled={activities.length === 0}
        >
          Clear History
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">📋</span>
          <p className="empty-state__text">No encryption or decryption activity recorded yet.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Name</th>
                <th>Size</th>
                <th>Option</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => {
                const isRevealed = !!revealedPasswords[act.id];
                const displayedPassword = isRevealed ? revealedPasswords[act.id] : "••••••••";

                return (
                  <tr key={act.id}>
                    <td>{formatDate(act.timestamp)}</td>
                    <td>
                      <span className={`badge badge--${act.action}`}>
                        {act.action === "encrypt" ? "Encrypt" : "Decrypt"}
                      </span>
                    </td>
                    <td>
                      <div className="activity-name">
                        <span className="activity-icon">
                          {act.contentType === "folder" ? "📁" : "📄"}
                        </span>
                        <span className="activity-text" title={act.name}>
                          {act.name}
                        </span>
                      </div>
                    </td>
                    <td>{formatBytes(act.size)}</td>
                    <td>
                      {act.secureNames ? (
                        <span className="badge badge--secure" title="Filename was securely obfuscated during save">
                          Secure Filename
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {act.encryptedPassword ? (
                        <div className="password-cell">
                          <code className="password-display">{displayedPassword}</code>
                          <div className="password-actions">
                            <button
                              type="button"
                              className="btn btn--icon"
                              onClick={() => handleReveal(act.id, act.encryptedPassword!)}
                              title={isRevealed ? "Hide Password" : "Show Password"}
                            >
                              {isRevealed ? "👁️" : "🙈"}
                            </button>
                            <button
                              type="button"
                              className="btn btn--icon"
                              onClick={() => handleCopy(act.id, act.encryptedPassword!)}
                              title="Copy Password"
                            >
                              {copyingId === act.id ? "✓" : "📋"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
