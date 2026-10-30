import { parseXtreamLogin } from './parseXtreamLogin.mjs'
import { normalizePortal, playerApiUrl } from './xtreamUrls.mjs'

/** Tenta um portal: devolve o usuário quando o auth passa, senão null. */
async function tryPortal(portal, username, password, fetchFn) {
  try {
    const res = await fetchFn(playerApiUrl({ portal, username, password }))
    if (!res.ok) return null
    return parseXtreamLogin(await res.json())
  } catch {
    return null
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
  for (const raw of candidates) {
    let portal
    try {
      portal = normalizePortal(raw)
    } catch {
      continue
    }
    if (seen.has(portal)) continue
    seen.add(portal)
    const user = await tryPortal(portal, username, password, fetchFn)
    if (user) return { portal, user }
  }
  return null
}
