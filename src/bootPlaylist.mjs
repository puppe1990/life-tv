import { restorePlaylist } from './playlistSecret.mjs'
import { createXtreamClient } from './xtreamClient.mjs'

async function pingXc(saved, fetchFn, readSecret) {
  const password = saved.password ?? (await readSecret?.(saved.id))
  if (!password) return { error: new Error('senha ausente') }
  const playlist = saved.password ? saved : restorePlaylist(saved, password)
  const client = createXtreamClient({ playlist, fetch: fetchFn })
  try {
    await client.ping()
    return { playlist, client }
  } catch (error) {
    return { error }
  }
}

/** Primeira M3U, senão o primeiro XC que o portal aceita. */
export async function pickBootPlaylist(playlists, { fetch: fetchFn, readSecret } = {}) {
  if (!Array.isArray(playlists)) {
    throw new Error(`playlists recusadas: recebido ${JSON.stringify(playlists)}, esperada lista`)
  }
  const m3u = playlists.find((item) => item.kind === 'm3u')
  if (m3u) return { kind: 'm3u', playlist: m3u }
  let lastError = null
  for (const saved of playlists) {
    if (saved.kind !== 'xc') continue
    const result = await pingXc(saved, fetchFn, readSecret)
    if (result.client) return { kind: 'xc', playlist: result.playlist, client: result.client }
    lastError = result.error
  }
  return { kind: null, error: lastError }
}
