#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;

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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![play_sidecar])
        .run(tauri::generate_context!())
        .expect("falha ao abrir a janela do Life TV");
}
