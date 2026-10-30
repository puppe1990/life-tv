#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Write;
use std::os::unix::fs::OpenOptionsExt;
use std::process::Command;

/// Abre a URL no mpv (MPEG-TS/MKV que o webview não toca).
/// Sem mpv, cai no IINA (também mpv por baixo) via `open -a`.
#[tauri::command]
fn play_sidecar(url: String) -> Result<(), String> {
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err(format!("url recusada: recebido {url}, esperado http(s)"));
    }
    if Command::new("mpv")
        .arg("--fs")
        .arg(&url)
        .spawn()
        .is_ok()
    {
        return Ok(());
    }
    let iina = Command::new("open").args(["-a", "IINA", &url]).status();
    match iina {
        Ok(status) if status.success() => Ok(()),
        _ => Err("sem player externo: instale mpv (brew install mpv) ou IINA".to_string()),
    }
}

fn secrets_path() -> Result<std::path::PathBuf, String> {
    let home = std::env::var("HOME").map_err(|error| format!("secret recusado: {error}"))?;
    Ok(std::path::PathBuf::from(format!(
        "{home}/Library/Application Support/com.life-tv.app/secrets.json"
    )))
}

fn read_secrets() -> Result<std::collections::BTreeMap<String, String>, String> {
    let path = secrets_path()?;
    match std::fs::read_to_string(&path) {
        Ok(text) => {
            serde_json::from_str(&text).map_err(|error| format!("secret recusado: {error}"))
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            Ok(std::collections::BTreeMap::new())
        }
        Err(error) => Err(format!("secret recusado: {error}")),
    }
}

fn write_secrets(secrets: &std::collections::BTreeMap<String, String>) -> Result<(), String> {
    let path = secrets_path()?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|error| format!("secret recusado: {error}"))?;
    }
    let body =
        serde_json::to_string_pretty(secrets).map_err(|error| format!("secret recusado: {error}"))?;
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .mode(0o600)
        .open(&path)
        .map_err(|error| format!("secret recusado: {error}"))?;
    file.write_all(body.as_bytes())
        .map_err(|error| format!("secret recusado: {error}"))
}

/// Guarda a senha da playlist em arquivo local 0600 (sem Keychain).
#[tauri::command]
fn secret_set(account: String, value: String) -> Result<(), String> {
    let mut secrets = read_secrets()?;
    secrets.insert(account, value);
    write_secrets(&secrets)
}

/// Lê a senha da playlist; ausência vira None.
#[tauri::command]
fn secret_get(account: String) -> Result<Option<String>, String> {
    Ok(read_secrets()?.get(&account).cloned())
}

/// Lê o seed local de ajustes (sem senha; senha fica no Keychain).
#[tauri::command]
fn seed_read() -> Result<Option<String>, String> {
    let home = std::env::var("HOME").map_err(|error| format!("seed recusado: {error}"))?;
    let path = format!("{home}/Library/Application Support/com.life-tv.app/seed.json");
    match std::fs::read_to_string(&path) {
        Ok(text) => Ok(Some(text)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(format!("seed recusado: {error}")),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            play_sidecar,
            secret_set,
            secret_get,
            seed_read
        ])
        .run(tauri::generate_context!())
        .expect("falha ao abrir a janela do Life TV");
}
