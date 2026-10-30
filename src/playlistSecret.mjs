import { xcGetPhpUrl } from './xtreamUrls.mjs'

/** Copia da playlist sem senha nem get.php (a senha vai pro cofre local 0600). */
export function redactPlaylist(playlist) {
  if (!playlist || playlist.kind !== 'xc') return playlist
  const { password: _password, getPhpUrl: _getPhpUrl, ...rest } = playlist
  return rest
}

/** Recompõe senha e get.php de uma playlist gravada sem segredo. */
export function restorePlaylist(stored, password) {
  if (!stored || stored.kind !== 'xc') return stored
  if (typeof password !== 'string' || password === '') {
    throw new Error(
      `senha recusada: recebido ${JSON.stringify(password)}, esperado texto do cofre local`,
    )
  }
  return {
    ...stored,
    password,
    getPhpUrl: xcGetPhpUrl({
      portal: stored.portal,
      username: stored.username,
      password,
    }),
  }
}
