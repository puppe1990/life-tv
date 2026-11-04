import { loadM3uCatalog } from './loadM3uCatalog.mjs'

function catalogFrom(items) {
  const buckets = []
  const byName = new Map()
  const urls = new Map()
  let seq = 0
  for (const item of items) {
    const group = item.group?.trim() || 'Ao vivo'
    let bucket = byName.get(group)
    if (!bucket) {
      bucket = { id: String(byName.size + 1), name: group, items: [] }
      byName.set(group, bucket)
      buckets.push(bucket)
    }
    const id = ++seq
    urls.set(String(id), item.url)
    bucket.items.push({
      id,
      name: item.title,
      icon: item.tvgLogo ?? '',
      categoryId: bucket.id,
      url: item.url,
    })
  }
  return { catalog: { kind: 'live', categories: buckets }, urls }
}

/** Cliente de playlist M3U própria. Ao vivo só; filmes/séries vazios. */
export function createM3uClient({ playlist, fetch: fetchFn }) {
  if (!playlist || playlist.kind !== 'm3u') {
    throw new Error(`cliente recusado: recebido kind ${playlist?.kind}, esperado m3u`)
  }
  let loaded = null
  async function load() {
    if (loaded) return loaded
    const parsed = await loadM3uCatalog({
      url: playlist.url,
      content: playlist.content,
      fetch: fetchFn,
    })
    loaded = catalogFrom(parsed.items)
    return loaded
  }
  return {
    async liveCatalog() {
      return (await load()).catalog
    },
    async vodCatalog() {
      return { kind: 'vod', categories: [] }
    },
    async seriesCatalog() {
      return { kind: 'series', categories: [] }
    },
    livePlayUrl(streamId) {
      return loaded?.urls.get(String(streamId)) ?? ''
    },
    moviePlayUrl() {
      return ''
    },
    async shortEpg() {
      return []
    },
  }
}
