#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app_paths;
mod player;
mod secrets;
mod seed;

use tauri::AppHandle;

/// Abre a URL no player externo.
#[tauri::command]
fn play_sidecar(url: String) -> Result<(), String> {
    player::play(&url)
}

/// Grava a senha da playlist no cofre local 0600.
#[tauri::command]
fn secret_set(app: AppHandle, account: String, value: String) -> Result<(), String> {
    secrets::set(&app, &account, &value)
}

/// Lê a senha da playlist; ausência vira None.
#[tauri::command]
fn secret_get(app: AppHandle, account: String) -> Result<Option<String>, String> {
    secrets::get(&app, &account)
}

/// Lê o seed local de ajustes.
#[tauri::command]
fn seed_read(app: AppHandle) -> Result<Option<String>, String> {
    seed::read(&app)
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
        .expect("falha ao abrir a janela");
}
