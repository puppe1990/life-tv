/** xmltv.php uma vez por dia (Smarters AutoUpdateEPG=yes / 1 day). */
export const EPG_TTL_MS = 24 * 60 * 60 * 1000

function requirePlaylistId(playlistId) {
  if (typeof playlistId !== 'string' || playlistId.trim() === '') {
    throw new Error(`guia recusada: recebido playlistId ${JSON.stringify(playlistId)}, esperado id`)
  }
  return playlistId
}

/** Lê os programas xmltv se ainda estão no TTL. */
export function readFreshGuide(bucket, { playlistId, now = Date.now(), ttlMs = EPG_TTL_MS }) {
  const entry = (bucket.read() ?? {})[requirePlaylistId(playlistId)]
  if (!Array.isArray(entry?.programs) || !Number.isFinite(entry.savedAt)) return null
  if (now - entry.savedAt > ttlMs) return null
  return entry.programs
}

/** Grava o xmltv da playlist. */
export function writeGuideCache(bucket, { playlistId, programs, now = Date.now() }) {
  const all = { ...(bucket.read() ?? {}) }
  all[requirePlaylistId(playlistId)] = { programs, savedAt: now }
  bucket.write(all)
}
