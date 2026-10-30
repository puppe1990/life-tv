use std::process::Command;

const DEFAULT_PLAYER: &str = "mpv";
const DEFAULT_PLAYER_APP: &str = "IINA";
const PLAYER_ENV: &str = "LIFE_TV_PLAYER";
const PLAYER_APP_ENV: &str = "LIFE_TV_PLAYER_APP";

fn player_command() -> String {
    std::env::var(PLAYER_ENV).unwrap_or_else(|_| DEFAULT_PLAYER.to_string())
}

fn player_app() -> String {
    std::env::var(PLAYER_APP_ENV).unwrap_or_else(|_| DEFAULT_PLAYER_APP.to_string())
}

/// Abre a URL no player externo (MPEG-TS/MKV que o webview não toca).
/// Usa `LIFE_TV_PLAYER` e, sem ele, `open -a LIFE_TV_PLAYER_APP`.
pub fn play(url: &str) -> Result<(), String> {
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err(format!("url recusada: recebido {url}, esperado http(s)"));
    }
    let player = player_command();
    if Command::new(&player).arg("--fs").arg(url).spawn().is_ok() {
        return Ok(());
    }
    let app = player_app();
    match Command::new("open").args(["-a", &app, url]).status() {
        Ok(status) if status.success() => Ok(()),
        _ => Err(format!(
            "sem player externo: instale {player} ou {app} (ou ajuste {PLAYER_ENV}/{PLAYER_APP_ENV})"
        )),
    }
}
