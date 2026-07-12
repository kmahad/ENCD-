# Detailed Step-by-Step Guide to Build Securitas Desktop App with No Console Window

## Prerequisites

- We have already:
  - Added `#![windows_subsystem = "windows"]` to `apps/desktop/src-tauri/src/main.rs`
  - Added `[package.metadata.windows] subsystem = "windows"` to `apps/desktop/src-tauri/Cargo.toml`
  - Restored the original `Cargo.lock` file
  - Installed `@types/node` and fixed TypeScript configs

---

## Step 1: Update to the Latest Rust Nightly (Regression Fixed)

The panic you were hitting is a known Rust regression, and the fix is in the latest nightly build!

1. Open PowerShell/Terminal in your project root (`d:\encrypter`)
2. Install and set the latest nightly:
   ```powershell
   rustup update nightly
   rustup default nightly
   rustc --version  # verify it's nightly-2026-07-12 or newer
   ```

---

## Step 2: Clean Old Build Artifacts

1. In `d:\encrypter`, run:
   ```powershell
   cd apps/desktop/src-tauri
   Remove-Item -Path target -Recurse -Force -ErrorAction SilentlyContinue
   cd ../../..
   ```

---

## Step 3: Build the Desktop App Frontend (First)

1. In `d:\encrypter`, run:
   ```powershell
   cd apps/desktop
   pnpm build
   ```
   Wait for it to say "built in X.Xs"!

---

## Step 4: Build the Full Tauri App

1. Now run:
   ```powershell
   pnpm tauri build
   ```
2. This will take a few minutes! Let it finish completely!

---

## Step 5: Locate the New Setup EXE

1. When done, your new Windows installer will be here:
   `d:\encrypter\apps\desktop\src-tauri\target\release\bundle\nsis\Encrypter_1.0.0_x64-setup.exe`

---

## Step 6: Copy It to Web App's Public Downloads Folder

1. Copy that EXE to replace the placeholder:
   ```powershell
   Copy-Item -Path 'd:\encrypter\apps\desktop\src-tauri\target\release\bundle\nsis\Encrypter_1.0.0_x64-setup.exe' -Destination 'd:\encrypter\apps\web\public\downloads\Securitas_File_Lock_Setup.exe' -Force
   ```

---

## Step 7: Uninstall the Old App and Install the New One

1. Go to "Add or Remove Programs" in Windows Settings
2. Uninstall "Securitas File Lock"
3. Download the new EXE from your web app at http://localhost:5174/ and install it!
4. Launch it—no console window should appear!

---

## If You Hit Any Issues

- Remember we still have the backup scripts!
- Use `launch_no_console.vbs` as an alternative launcher!
