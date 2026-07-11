use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use walkdir::WalkDir;

#[derive(Serialize, Deserialize)]
struct FolderEntry {
    path: String,
    data: Vec<u8>,
}

#[derive(Serialize)]
struct PickedPath {
    path: String,
    is_dir: bool,
}

#[tauri::command]
fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file_bytes(path: String, data: Vec<u8>) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, data).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_folder_entries(folder_path: String) -> Result<Vec<FolderEntry>, String> {
    let root = PathBuf::from(&folder_path);
    if !root.is_dir() {
        return Err("Path is not a directory".into());
    }

    let folder_name = root
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("folder")
        .to_string();

    let mut entries = Vec::new();

    for entry in WalkDir::new(&root).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let full = entry.path();
            let relative = full
                .strip_prefix(&root)
                .map_err(|e| e.to_string())?
                .to_string_lossy()
                .replace('\\', "/");

            let data = fs::read(full).map_err(|e| e.to_string())?;
            entries.push(FolderEntry {
                path: relative,
                data,
            });
        }
    }

    if entries.is_empty() {
        return Err(format!("Folder '{}' is empty", folder_name));
    }

    Ok(entries)
}

#[tauri::command]
fn write_folder_entries(
    output_dir: String,
    folder_name: String,
    entries: Vec<FolderEntry>,
) -> Result<String, String> {
    let base = PathBuf::from(&output_dir).join(&folder_name);
    fs::create_dir_all(&base).map_err(|e| e.to_string())?;

    for entry in entries {
        let dest = base.join(&entry.path);
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&dest, &entry.data).map_err(|e| e.to_string())?;
    }

    Ok(base.to_string_lossy().to_string())
}

#[tauri::command]
fn get_file_name(path: String) -> Result<String, String> {
    Path::new(&path)
        .file_name()
        .and_then(|n| n.to_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid path".into())
}

#[tauri::command]
fn check_path(path: String) -> Result<PickedPath, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("Path does not exist".into());
    }
    Ok(PickedPath {
        path: path.clone(),
        is_dir: p.is_dir(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_file_bytes,
            write_file_bytes,
            read_folder_entries,
            write_folder_entries,
            get_file_name,
            check_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
