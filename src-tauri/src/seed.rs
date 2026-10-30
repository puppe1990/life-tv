use crate::app_paths::data_file;

const SEED_FILE: &str = "seed.json";

/// Lê o seed local de ajustes (nome, portal, usuário, candidatos).
pub fn read(app: &tauri::AppHandle) -> Result<Option<String>, String> {
    let path = data_file(app, SEED_FILE)?;
    match std::fs::read_to_string(&path) {
        Ok(text) => Ok(Some(text)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(format!("seed recusado: {error}")),
    }
}
