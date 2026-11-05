import { mapCatalog } from './mapCatalog.mjs'
import { flattenEpisodes } from './parseSeriesInfo.mjs'
import { parseShortEpg } from './parseShortEpg.mjs'
import { parseXmltv } from './parseXmltv.mjs'
import { parseVodInfo } from './parseVodInfo.mjs'
import { parseXtreamLogin } from './parseXtreamLogin.mjs'
import { describeXtreamRefusal } from './xtreamRefusal.mjs'
import {
  liveStreamUrl,
  movieStreamUrl,
  playerApiUrl,
  redactUrl,
  seriesStreamUrl,
  timeshiftUrl,
  xmltvUrl,
  xtreamFetchInit,
} from './xtreamUrls.mjs'

async function readBody(res, url) {
  const raw = await res.text()
  if (!res.ok) throw new Error(describeXtreamRefusal({ status: res.status, raw, url }))
  return raw
}

async function getJson(fetchFn, cred, action, params = null) {
  const url = playerApiUrl({ ...cred, action, params })
  const raw = await readBody(await fetchFn(url, xtreamFetchInit()), url)
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(`xtream recusado: recebido corpo não-JSON em ${redactUrl(url)}, esperado JSON`)
  }
}

async function getText(fetchFn, url) {
  return readBody(await fetchFn(url, xtreamFetchInit()), url)
}

function decodeBase64Text(value) {
  if (typeof Buffer !== 'undefined') return Buffer.from(value, 'base64').toString('utf8')
  const binary = globalThis.atob(value)
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))
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
    async ping() {
      try {
        return await this.login()
      } catch (error) {
        if (!/HTTP 404/.test(error.message)) throw error
        await getJson(fetchFn, cred, 'get_live_streams')
        return { status: 'Active' }
      }
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
    seriesPlayUrl(episodeId, extension) {
      return seriesStreamUrl({ ...cred, episodeId, extension })
    },
    async seriesEpisodes(seriesId) {
      const payload = await getJson(fetchFn, cred, 'get_series_info', { series_id: seriesId })
      return flattenEpisodes(payload)
    },
    async vodInfo(vodId) {
      return parseVodInfo(await getJson(fetchFn, cred, 'get_vod_info', { vod_id: vodId }))
    },
    async shortEpg(streamId) {
      const payload = await getJson(fetchFn, cred, 'get_short_epg', { stream_id: streamId })
      return parseShortEpg(payload, { decodeBase64: decodeBase64Text })
    },
    async epg() {
      return parseXmltv(await getText(fetchFn, xmltvUrl(cred)))
    },
    catchUpUrl({ streamId, durationMinutes, start }) {
      return timeshiftUrl({ ...cred, streamId, durationMinutes, start })
    },
  }
}
