/**
 * URLs públicas do Xtream Codes (player_api / get.php / live|movie|series).
 * Equivale a GetSharedInfo.getPlaylistUrl no FlexTV, sem POST de MAC.
 */
export function normalizePortal(url) {
  if (typeof url !== 'string' || url.trim() === '') {
    throw new Error(`portal recusado: recebido ${JSON.stringify(url)}, esperado URL http(s)`)
  }
  let value = url.trim().replace(/\/+$/, '')
  value = value.replace(/\/player_api\.php$/i, '')
  value = value.replace(/\/c$/i, '')
  return value.replace(/\/+$/, '')
}

function encodeCred(username, password) {
  return {
    user: encodeURIComponent(username),
    pass: encodeURIComponent(password),
  }
}

export function xcGetPhpUrl({ portal, username, password, type = 'm3u_plus', output = 'ts' }) {
  const base = normalizePortal(portal)
  const { user, pass } = encodeCred(username, password)
  return `${base}/get.php?username=${user}&password=${pass}&type=${type}&output=${output}`
}

export function playerApiUrl({ portal, username, password, action }) {
  const base = normalizePortal(portal)
  const { user, pass } = encodeCred(username, password)
  const qs = `username=${user}&password=${pass}`
  if (!action) return `${base}/player_api.php?${qs}`
  return `${base}/player_api.php?${qs}&action=${encodeURIComponent(action)}`
}

export function liveStreamUrl({ portal, username, password, streamId, output = 'm3u8' }) {
  const base = normalizePortal(portal)
  const { user, pass } = encodeCred(username, password)
  return `${base}/live/${user}/${pass}/${streamId}.${output}`
}

export function movieStreamUrl({ portal, username, password, streamId, extension }) {
  const base = normalizePortal(portal)
  const { user, pass } = encodeCred(username, password)
  return `${base}/movie/${user}/${pass}/${streamId}.${extension}`
}

export function seriesStreamUrl({ portal, username, password, episodeId, extension }) {
  const base = normalizePortal(portal)
  const { user, pass } = encodeCred(username, password)
  return `${base}/series/${user}/${pass}/${episodeId}.${extension}`
}
