use tauri::Manager;

/// Diretório de dados do app, derivado do `identifier` do tauri.conf.json.
pub fn data_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    app.path()
        .app_config_dir()
        .map_err(|error| format!("diretório recusado: {error}"))
}

pub fn data_file(app: &tauri::AppHandle, name: &str) -> Result<std::path::PathBuf, String> {
    Ok(data_dir(app)?.join(name))
}
