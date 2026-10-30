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

export function playerApiUrl({ portal, username, password, action, params = null }) {
  const base = normalizePortal(portal)
  const { user, pass } = encodeCred(username, password)
  const qs = `username=${user}&password=${pass}`
  const extra = params
    ? Object.entries(params)
        .map(([key, value]) => `&${key}=${encodeURIComponent(value)}`)
        .join('')
    : ''
  if (!action) return `${base}/player_api.php?${qs}${extra}`
  return `${base}/player_api.php?${qs}&action=${encodeURIComponent(action)}${extra}`
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

export function xmltvUrl({ portal, username, password }) {
  const base = normalizePortal(portal)
  const { user, pass } = encodeCred(username, password)
  return `${base}/xmltv.php?username=${user}&password=${pass}`
}

const TIMESHIFT_START = /^(\d{4})-(\d{2})-(\d{2})[ T:](\d{2})[:-](\d{2})/

/** Normaliza "AAAA-MM-DD HH:mm:ss" (Xtream) para "AAAA-MM-DD:HH-mm" (URL). */
export function timeshiftStart(value) {
  const match = String(value).match(TIMESHIFT_START)
  if (!match) {
    throw new Error(
      `start recusado: recebido ${JSON.stringify(value)}, esperado AAAA-MM-DD HH:mm:ss`,
    )
  }
  const [, year, month, day, hour, minute] = match
  return `${year}-${month}-${day}:${hour}-${minute}`
}

export function timeshiftUrl({ portal, username, password, streamId, durationMinutes, start }) {
  const normalized = timeshiftStart(start)
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error(
      `duração recusada: recebido ${JSON.stringify(durationMinutes)}, esperado minutos inteiros`,
    )
  }
  const base = normalizePortal(portal)
  const { user, pass } = encodeCred(username, password)
  return `${base}/timeshift/${user}/${pass}/${durationMinutes}/${normalized}/${streamId}.ts`
}

const SECRET_QUERY = /((?:password|jwt)=)[^&]*/gi

/** Mascara senha e jwt em qualquer URL exibida ou logada. */
export function redactUrl(url) {
  if (typeof url !== 'string') return url
  return url.replace(SECRET_QUERY, '$1***')
}
