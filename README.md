# Encrypter

Free, local file and folder encryption for sharing with friends and coworkers.

Encrypt anything — PDFs, images, documents, or entire folders — with a password. Send the `.enc` file through email, WhatsApp, Google Drive, or USB. Your friend decrypts it with the same password using this app (web or desktop).

**Everything runs on your device.** No accounts, no cloud upload, no paid services.

## Features

- Encrypt single files or whole folders
- Decrypt with password — wrong password is rejected safely
- Shared `.enc` format works across **web** and **desktop**
- AES-256-GCM encryption + Argon2id key derivation
- **Peer-to-Peer (P2P) file transfer** — send encrypted files directly to friends over the internet
- 100% free and open source

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/): `npm install -g pnpm`
- For desktop builds: [Rust](https://rustup.rs/)

### Install dependencies

```bash
pnpm install
```

### Run the website (development)

```bash
pnpm dev:web
```

Open http://localhost:5173

### Run the desktop app (development)

```bash
pnpm dev:desktop
```

### Build for production

```bash
# Web static site
pnpm build:web

# Desktop installer (Windows .msi/.exe)
pnpm build:desktop
```

## How to share encrypted files

### Method 1: Traditional sharing

1. **Encrypt** your file or folder and set a strong password (8+ characters).
2. **Download** the `.enc` file.
3. **Send** the `.enc` file to your friend (any method you like).
4. **Share the password separately** — e.g. phone call or a different chat app.
5. Your friend opens the **web app** or **desktop app**, uploads/opens the `.enc` file, enters the password, and downloads the original content.

> **Tip:** Never send the password in the same message as the file.

### Method 2: Peer-to-Peer (P2P) transfer

1. Both you and your friend open the **web app** or **desktop app** and go to the "Transfer" tab.
2. The recipient selects "Receive" — a QR code with their Peer ID will appear for easy sharing, or they can copy the Peer ID manually.
3. You select "Send", either scan the recipient's QR code or paste their Peer ID manually, and connect.
4. You select an encrypted file and send it directly to your friend.
5. Your friend receives the file and decrypts it with the password.

## Deploy the website (free)

### GitHub Pages

1. Push this repo to GitHub.
2. Build the web app: `pnpm build:web`
3. Deploy `apps/web/dist` to GitHub Pages (see `.github/workflows/deploy.yml`).

Or manually:

```bash
cd apps/web
pnpm build
# Upload dist/ to any static host (Netlify, Cloudflare Pages, etc.)
```

### Desktop releases

Build the desktop app and upload installers to **GitHub Releases** (free):

```bash
pnpm build:desktop
# Installers are in apps/desktop/src-tauri/target/release/bundle/
```

## Project structure

```
encrypter/
├── packages/crypto-core/   # Shared encryption library (.enc format)
├── apps/web/               # Browser app (Vite + React)
└── apps/desktop/           # Desktop app (Tauri + React)
```

## Security

| Property         | Detail                                |
| ---------------- | ------------------------------------- |
| Cipher           | AES-256-GCM (authenticated)           |
| Key derivation   | Argon2id (64 MB memory, 3 iterations) |
| Password storage | Never stored or transmitted           |
| Server           | None — all crypto is client-side      |

## Web limitations

Browsers load entire files into memory. For files or folders **larger than ~500 MB**, use the **desktop app** for better performance and reliability.

## License

MIT
