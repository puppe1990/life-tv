#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;

const KEYCHAIN_SERVICE: &str = "life-tv";

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

fn keychain_entry(account: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new(KEYCHAIN_SERVICE, account)
        .map_err(|error| format!("keychain recusado: {error}"))
}

/// Guarda a senha da playlist no Keychain do macOS.
#[tauri::command]
fn secret_set(account: String, value: String) -> Result<(), String> {
    keychain_entry(&account)?
        .set_password(&value)
        .map_err(|error| format!("keychain recusado: {error}"))
}

/// Lê a senha da playlist; ausência vira None.
#[tauri::command]
fn secret_get(account: String) -> Result<Option<String>, String> {
    match keychain_entry(&account)?.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(format!("keychain recusado: {error}")),
    }
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
