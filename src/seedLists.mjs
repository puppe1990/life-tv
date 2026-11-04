function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/** Listas M3U do seed local (name + url). */
export function seedM3uPlaylists(seed) {
  const rows = Array.isArray(seed?.m3u) ? seed.m3u : []
  const lists = []
  for (const row of rows) {
    const name = text(row?.name)
    const url = text(row?.url)
    if (!name || !url) continue
    lists.push({ kind: 'm3u', name, url })
  }
  return lists
}

/** Campos do formulário de Ajustes: playlist ativa + seed (portal/usuário/M3U). */
export function settingsFormValues({ playlist, seed }) {
  const xc = playlist?.kind === 'xc' ? playlist : null
  const m3u = playlist?.kind === 'm3u' ? playlist : null
  const seedM3u = seedM3uPlaylists(seed)[0]
  return {
    name: text(playlist?.name) || text(seed?.name),
    portal: text(xc?.portal) || text(seed?.portal),
    username: text(xc?.username) || text(seed?.username),
    m3u: text(m3u?.url) || text(seedM3u?.url),
    candidates: Array.isArray(seed?.candidates) ? seed.candidates.filter(Boolean).join('\n') : '',
  }
}
