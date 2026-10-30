# Life TV — regras pra agentes

Núcleo de catálogo/player para playlists **próprias** Xtream/M3U. Spec veio do APK LIFE TV (white-label FlexTV). Sem VPN, MAC cloud, Unsafe TLS ou dump de segredo.

## Comandos

```bash
npm ci
npm test            # node --test + @faker-js/faker
npm run lint
npm run format:check
npm run ci
npm run dev         # http://127.0.0.1:8792/web/  (não use 8765)
```

Pre-commit: lint-staged + `npm test`. CI GitHub Actions = `npm run ci`.

## Code style

- Functions: 4–20 linhas. Files: alvo 200–300, teto 500.
- Uma responsabilidade por módulo. Espelho `src/foo.mjs` ↔ `test/foo.test.mjs`.
- Nomes greppáveis. Evite `data`, `handler`, `Manager`, `utils`.
- JSDoc nos exports públicos. Sem TypeScript neste núcleo.
- Erro inclui valor recebido e forma esperada.
- Early returns. Máximo 2 níveis de indentação no fluxo.

## Tests

- Um comando: `npm test`. TDD: teste vermelho **antes** do domínio.
- Factories em `test/factories.mjs`; `faker.seed` por arquivo.
- Catálogos, logins e M3U vêm do faker (hosts `.net`/`.org` sintéticos). Sem HTTP real.
- Cada função nova ganha teste. Bugfix ganha regressão.
- UI 10-foot em `web/` importa `../src/`. Preview pela raiz do repo.

## Fora de escopo

- POST de MAC para `second_create_url`
- `libhax.so` / VPN
- Chaves TMDB / OpenSubtitles / CryptMtx
- Playlists que não sejam do usuário
