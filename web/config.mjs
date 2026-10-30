/** Configuração de UI e persistência num lugar só. */
export const BRAND = 'Life TV'

export const STORAGE_PREFIX = 'life-tv'

export const STORAGE_KEYS = {
  playlists: `${STORAGE_PREFIX}:playlists`,
  favs: `${STORAGE_PREFIX}:favs`,
  resume: `${STORAGE_PREFIX}:resume`,
}

/** Conta do cofre local onde o seed guarda a senha inicial. */
export const SEED_ACCOUNT = 'seed'

export const DEFAULT_PLAYLIST_NAME = 'Casa'

export const SECRET_PLACEHOLDER = 'senha guardada localmente'
