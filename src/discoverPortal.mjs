import { parseXtreamLogin } from './parseXtreamLogin.mjs'
import { normalizePortal, playerApiUrl } from './xtreamUrls.mjs'

/** Tenta um portal e devolve usuário ou o motivo da recusa. */
async function tryPortal(portal, username, password, fetchFn) {
  try {
    const res = await fetchFn(playerApiUrl({ portal, username, password }))
    if (!res.ok) return { portal, error: `HTTP ${res.status}` }
    return { portal, user: parseXtreamLogin(await res.json()) }
  } catch (error) {
    return { portal, error: error?.message ?? String(error) }
  }
}

/** Testa candidatos e devolve o primeiro portal com auth válido. */
export async function discoverPortal({ candidates, username, password, fetch: fetchFn }) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error(
      `portais recusados: recebido ${JSON.stringify(candidates)}, esperada lista não vazia`,
    )
  }
  if (typeof fetchFn !== 'function') {
    throw new Error('descoberta recusada: recebido fetch ausente, esperado função')
  }
  const seen = new Set()
  const attempts = []
  for (const raw of candidates) {
    let portal
    try {
      portal = normalizePortal(raw)
    } catch {
      continue
    }
    if (seen.has(portal)) continue
    seen.add(portal)
    const attempt = await tryPortal(portal, username, password, fetchFn)
    attempts.push(attempt)
    if (attempt.user) return { portal, user: attempt.user, attempts }
  }
  return { portal: null, user: null, attempts }
}
