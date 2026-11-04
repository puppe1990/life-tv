import { redactUrl } from './xtreamUrls.mjs'

function panelDetail(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return ''
  try {
    const payload = JSON.parse(raw)
    if (payload && typeof payload === 'object' && payload.error) return String(payload.error)
  } catch {
    if (/<html/i.test(raw)) return 'página HTML'
  }
  return ''
}

function portalHost(url) {
  try {
    return new URL(url).host
  } catch {
    return ''
  }
}

/** Mensagem de recusa HTTP do player_api: status, erro do painel, host; senha fora. */
export function describeXtreamRefusal({ status, raw, url }) {
  const detail = panelDetail(raw)
  const extra = detail ? ` ${detail}` : ''
  const host = portalHost(url)
  const where = host ? `no portal ${host}` : `em ${redactUrl(url)}`
  return `xtream recusado: recebido HTTP ${status}${extra} ${where}, esperado 200`
}
