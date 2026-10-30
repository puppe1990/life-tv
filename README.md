# Life TV

Domínio JS do player de **playlists próprias** Xtream Codes (`player_api`) e M3U. Arquitetura lida no APK LIFE TV / FlexTV LiveStore, sem clonar VPN, MAC cloud, TLS inseguro nem catálogo de terceiros.

Destino: shell Tauri 2 em landscape 10-foot (Dell). Hoje o núcleo é testável sem UI.

```bash
npm ci
npm test            # node --test + @faker-js/faker
npm run ci          # prettier + lint + test
```

## O que entra

- Login Xtream (`user_info` / `server_info`)
- Portal → `get.php` / `player_api.php` / `live|movie|series`
- Playlist XC ou M3U **local** (MAC do add-playlist do app original fica de fora)
- Catálogo por categoria, parse M3U, MIME adaptativo, resume, favorito e lock

## Fora

- Phone-home com MAC, `libhax` / VPN, dump de chaves, streams que não são da playlist do usuário
