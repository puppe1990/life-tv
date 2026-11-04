import { normalizePortal, xcGetPhpUrl } from './xtreamUrls.mjs'

function requireText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`playlist recusada: recebido ${field} ${JSON.stringify(value)}, esperado texto`)
  }
  return value.trim()
}

function addXc(input) {
  const name = requireText(input.name, 'name')
  const portal = normalizePortal(input.portal)
  const username = requireText(input.username, 'username')
  const password = requireText(input.password, 'password')
  return {
    kind: 'xc',
    name,
    portal,
    username,
    password,
    getPhpUrl: xcGetPhpUrl({ portal, username, password }),
  }
}

function addM3u(input) {
  const name = requireText(input.name, 'name')
  const url = typeof input.url === 'string' ? input.url.trim() : ''
  const content = typeof input.content === 'string' ? input.content : ''
  if (!url && !content) {
    throw new Error('playlist recusada: recebido m3u sem fonte, esperado url ou content')
  }
  const playlist = { kind: 'm3u', name }
  if (url) playlist.url = url
  if (content) playlist.content = content
  return playlist
}

function nextSeq(items) {
  return items.reduce((max, item) => Math.max(max, Number(String(item.id).slice(3)) || 0), 0)
}

function replaceItems(items, saved) {
  items.length = 0
  if (Array.isArray(saved)) items.push(...saved)
}

/** Playlist XC/M3U local. Campo `mac` do FlexTV não é gravado. */
export function createPlaylistStore({ bucket = null } = {}) {
  const items = []
  replaceItems(items, bucket?.read())
  let seq = nextSeq(items)
  function persist() {
    bucket?.write(items)
  }
  return {
    hydrate() {
      replaceItems(items, bucket?.read())
      seq = nextSeq(items)
    },
    add(input) {
      if (!input || (input.kind !== 'xc' && input.kind !== 'm3u')) {
        throw new Error(`playlist recusada: recebido kind ${input?.kind}, esperado xc ou m3u`)
      }
      const playlist = {
        id: `pl-${++seq}`,
        ...(input.kind === 'xc' ? addXc(input) : addM3u(input)),
      }
      items.push(playlist)
      persist()
      return playlist
    },
    list() {
      return [...items]
    },
  }
}
