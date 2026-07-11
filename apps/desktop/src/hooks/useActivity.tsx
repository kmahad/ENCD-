import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ActivityEntry {
  id: string;
  timestamp: number;
  action: "encrypt" | "decrypt";
  contentType: "file" | "folder";
  name: string;
  size: number;
  encryptedPassword?: string;
  secureNames: boolean;
}

interface ActivityContextType {
  activities: ActivityEntry[];
  savePasswords: boolean;
  setSavePasswords: (val: boolean) => void;
  addActivity: (
    name: string,
    action: "encrypt" | "decrypt",
    contentType: "file" | "folder",
    size: number,
    secureNames: boolean,
    password?: string
  ) => Promise<void>;
  clearActivities: () => void;
  decryptPassword: (encryptedBase64: string) => Promise<string>;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

function getOrCreateLocalKey(): string {
  let key = localStorage.getItem("securitas_log_key");
  if (!key) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    key = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem("securitas_log_key", key);
  }
  return key;
}

async function encryptLocal(text: string, keyString: string): Promise<string> {
  const enc = new TextEncoder();
  const rawKey = enc.encode(keyString.padEnd(32, "0").slice(0, 32));
  const key = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    enc.encode(text)
  );
  const combined = new Uint8Array(nonce.length + ciphertext.byteLength);
  combined.set(nonce);
  combined.set(new Uint8Array(ciphertext), nonce.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptLocal(encryptedBase64: string, keyString: string): Promise<string> {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const rawKey = enc.encode(keyString.padEnd(32, "0").slice(0, 32));
  const key = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  const combined = new Uint8Array(
    atob(encryptedBase64)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
  const nonce = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    ciphertext
  );
  return dec.decode(plaintext);
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [savePasswords, setSavePasswordsState] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("securitas_activities");
    if (saved) {
      try {
        setActivities(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    const savedToggle = localStorage.getItem("securitas_save_passwords");
    if (savedToggle) {
      setSavePasswordsState(savedToggle === "true");
    }
  }, []);

  const setSavePasswords = (val: boolean) => {
    setSavePasswordsState(val);
    localStorage.setItem("securitas_save_passwords", String(val));
  };

  const addActivity = async (
    name: string,
    action: "encrypt" | "decrypt",
    contentType: "file" | "folder",
    size: number,
    secureNames: boolean,
    password?: string
  ) => {
    let encryptedPassword: string | undefined = undefined;
    if (savePasswords && password) {
      try {
        const localKey = getOrCreateLocalKey();
        encryptedPassword = await encryptLocal(password, localKey);
      } catch (e) {
        console.error("Local encryption failed:", e);
      }
    }

    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action,
      contentType,
      name,
      size,
      secureNames,
      encryptedPassword,
    };

    const updated = [entry, ...activities];
    setActivities(updated);
    localStorage.setItem("securitas_activities", JSON.stringify(updated));
  };

  const clearActivities = () => {
    setActivities([]);
    localStorage.removeItem("securitas_activities");
  };

  const decryptPassword = async (encryptedBase64: string): Promise<string> => {
    const localKey = getOrCreateLocalKey();
    return decryptLocal(encryptedBase64, localKey);
  };

  return (
    <ActivityContext.Provider
      value={{
        activities,
        savePasswords,
        setSavePasswords,
        addActivity,
        clearActivities,
        decryptPassword,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) {
    throw new Error("useActivity must be used within ActivityProvider");
  }
  return ctx;
}
