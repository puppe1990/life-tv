import { mapCatalog } from './mapCatalog.mjs'
import { parseXtreamLogin } from './parseXtreamLogin.mjs'
import { liveStreamUrl, movieStreamUrl, playerApiUrl } from './xtreamUrls.mjs'

async function getJson(fetchFn, cred, action) {
  const url = playerApiUrl({ ...cred, action })
  const res = await fetchFn(url)
  if (!res.ok) {
    throw new Error(`xtream recusado: recebido HTTP ${res.status} em ${url}, esperado 200`)
  }
  return res.json()
}

function credOf(playlist) {
  return {
    portal: playlist.portal,
    username: playlist.username,
    password: playlist.password,
  }
}

/** Cliente player_api com fetch injetável. Playlist XC local, sem MAC. */
export function createXtreamClient({ playlist, fetch: fetchFn }) {
  if (!playlist || playlist.kind !== 'xc') {
    throw new Error(`cliente recusado: recebido kind ${playlist?.kind}, esperado xc`)
  }
  if (typeof fetchFn !== 'function') {
    throw new Error('cliente recusado: recebido fetch ausente, esperado função')
  }
  const cred = credOf(playlist)
  return {
    async login() {
      return parseXtreamLogin(await getJson(fetchFn, cred))
    },
    async liveCatalog() {
      const [categories, streams] = await Promise.all([
        getJson(fetchFn, cred, 'get_live_categories'),
        getJson(fetchFn, cred, 'get_live_streams'),
      ])
      return mapCatalog({ kind: 'live', categories, streams })
    },
    async vodCatalog() {
      const [categories, streams] = await Promise.all([
        getJson(fetchFn, cred, 'get_vod_categories'),
        getJson(fetchFn, cred, 'get_vod_streams'),
      ])
      return mapCatalog({ kind: 'vod', categories, streams })
    },
    async seriesCatalog() {
      const [categories, streams] = await Promise.all([
        getJson(fetchFn, cred, 'get_series_categories'),
        getJson(fetchFn, cred, 'get_series'),
      ])
      return mapCatalog({ kind: 'series', categories, streams })
    },
    livePlayUrl(streamId) {
      return liveStreamUrl({ ...cred, streamId })
    },
    moviePlayUrl(streamId, extension) {
      return movieStreamUrl({ ...cred, streamId, extension })
    },
  }
}
