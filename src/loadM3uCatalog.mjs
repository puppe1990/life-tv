import { parseM3u } from './parseM3u.mjs'

/** Carrega M3U de content local ou de URL com fetch injetável. */
export async function loadM3uCatalog({ url, content, fetch: fetchFn }) {
  if (typeof content === 'string' && content.trim()) return parseM3u(content)
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error('m3u recusado: recebido sem fonte, esperado url ou content')
  }
  if (typeof fetchFn !== 'function') {
    throw new Error('m3u recusado: recebido fetch ausente, esperado função')
  }
  const res = await fetchFn(url)
  if (!res.ok) {
    throw new Error(`m3u recusado: recebido HTTP ${res.status} em ${url}, esperado 200`)
  }
  return parseM3u(await res.text())
}
