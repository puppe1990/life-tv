#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;

const KEYCHAIN_SERVICE: &str = "life-tv";

/// Abre a URL no mpv (MPEG-TS/MKV que o webview não toca).
#[tauri::command]
fn play_sidecar(url: String) -> Result<(), String> {
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err(format!("url recusada: recebido {url}, esperado http(s)"));
    }
    Command::new("mpv")
        .arg("--fs")
        .arg(&url)
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("mpv recusado: {error}"))
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

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            play_sidecar,
            secret_set,
            secret_get
        ])
        .run(tauri::generate_context!())
        .expect("falha ao abrir a janela do Life TV");
}
