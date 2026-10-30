# Life TV

Domínio JS do player de **playlists próprias** Xtream Codes (`player_api`) e M3U. Arquitetura lida no APK LIFE TV / FlexTV LiveStore, sem clonar VPN, MAC cloud, TLS inseguro nem catálogo de terceiros.

Destino: shell Tauri 2 em landscape 10-foot (Dell). Hoje o núcleo é testável sem UI.

```bash
npm ci
npm test            # node --test + @faker-js/faker
npm run css         # Tailwind CLI → web/style.css (tokens CRT em web/input.css)
npm run ci          # css + prettier + lint + test
npm run dev         # css + http://127.0.0.1:8792/web/
npm run tauri:dist  # junta web/ + src/ em .tauri-dist (frontendDist do Tauri)
npm run tauri:dev   # janela Tauri 2 em 1920x1080 com o front embutido
npm run tauri:app   # empacota target-app/Life TV.app (release + codesign ad-hoc)
```

Repo: https://github.com/puppe1990/life-tv

Notas da engenharia reversa do APK de referência (protocolo, ofuscação, endpoints):
[docs/reverse-engineering.md](docs/reverse-engineering.md).

Home 10-foot: **Ao vivo / Filmes / Séries / Ajustes**. Setas e Enter. Demo local sem rede.

## O que entra

- Login Xtream (`user_info` / `server_info`)
- Portal → `get.php` / `player_api.php` / `live|movie|series`
- Playlist XC ou M3U **local** (MAC do add-playlist do app original fica de fora)
- Catálogo por categoria, parse M3U, MIME adaptativo, resume, favorito e lock

## Fora

- Phone-home com MAC, `libhax` / VPN, dump de chaves, streams que não são da playlist do usuário
- Arte do ícone/logo: pertence ao app de referência, usada só para uso local
