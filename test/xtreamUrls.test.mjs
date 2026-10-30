import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  liveStreamUrl,
  movieStreamUrl,
  normalizePortal,
  playerApiUrl,
  seriesStreamUrl,
  timeshiftStart,
  timeshiftUrl,
  xmltvUrl,
  xcGetPhpUrl,
} from '../src/xtreamUrls.mjs'
import { faker, fakerPassword, fakerPortal, fakerUsername, fakerVodStream } from './factories.mjs'

beforeEach(() => {
  faker.seed(42)
})

test('normalizePortal tira barra final e player_api.php do faker', () => {
  const base = fakerPortal({ protocol: 'http', port: 8080 })
  assert.equal(normalizePortal(`${base}/`), base)
  assert.equal(normalizePortal(`${base}/player_api.php`), base)
  assert.equal(normalizePortal(`${base}/player_api.php/`), base)
  assert.equal(normalizePortal(`  ${base}/c/  `), base)
})

test('xcGetPhpUrl concatena get.php com user e senha do faker', () => {
  const portal = fakerPortal({ protocol: 'http', port: 8080 })
  const username = fakerUsername()
  const password = fakerPassword()
  const url = xcGetPhpUrl({ portal: `${portal}/`, username, password })
  assert.equal(
    url,
    `${portal}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=ts`,
  )
})

test('playerApiUrl monta action do faker sem barra dupla', () => {
  const portal = fakerPortal({ protocol: 'http', port: 25461 })
  const username = fakerUsername()
  const password = fakerPassword()
  const url = playerApiUrl({
    portal: `${portal}/player_api.php`,
    username,
    password,
    action: 'get_live_categories',
  })
  assert.equal(
    url,
    `${portal}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_categories`,
  )
})

test('liveStreamUrl usa live/user/pass/id.m3u8', () => {
  const portal = fakerPortal({ protocol: 'http', port: 8080 })
  const username = fakerUsername()
  const password = fakerPassword()
  const streamId = faker.number.int({ min: 1000, max: 99_999 })
  assert.equal(
    liveStreamUrl({ portal, username, password, streamId }),
    `${portal}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${streamId}.m3u8`,
  )
})

test('movieStreamUrl usa container_extension do faker', () => {
  const portal = fakerPortal({ protocol: 'http', port: 8080 })
  const username = fakerUsername()
  const password = fakerPassword()
  const vod = fakerVodStream()
  assert.equal(
    movieStreamUrl({
      portal,
      username,
      password,
      streamId: vod.stream_id,
      extension: vod.container_extension,
    }),
    `${portal}/movie/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${vod.stream_id}.${vod.container_extension}`,
  )
})

test('seriesStreamUrl usa series/user/pass/id.ext', () => {
  const portal = fakerPortal({ protocol: 'https', port: 443 })
  const username = fakerUsername()
  const password = fakerPassword()
  const episodeId = faker.number.int({ min: 10_000, max: 99_999 })
  const extension = faker.helpers.arrayElement(['mp4', 'mkv'])
  assert.equal(
    seriesStreamUrl({ portal, username, password, episodeId, extension }),
    `${portal}/series/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${episodeId}.${extension}`,
  )
})

test('xmltvUrl usa xmltv.php com as credenciais', () => {
  const portal = `http://${faker.internet.domainName()}:8080`
  const username = faker.internet.username()
  const password = faker.internet.password()
  assert.equal(
    xmltvUrl({ portal, username, password }),
    `${portal}/xmltv.php?username=${username}&password=${password}`,
  )
})

test('timeshiftUrl normaliza o start do Xtream', () => {
  const portal = `http://${faker.internet.domainName()}`
  const streamId = faker.number.int({ min: 100, max: 999 })
  const url = timeshiftUrl({
    portal,
    username: 'u',
    password: 'p',
    streamId,
    durationMinutes: 120,
    start: '2026-10-30 12:00:00',
  })
  assert.equal(url, `${portal}/timeshift/u/p/120/2026-10-30:12-00/${streamId}.ts`)
})

test('timeshiftStart recusa formato desconhecido', () => {
  assert.throws(() => timeshiftStart('ontem'), /start recusado/)
})

test('timeshiftUrl recusa duração inválida', () => {
  assert.throws(
    () =>
      timeshiftUrl({
        portal: 'http://h',
        username: 'u',
        password: 'p',
        streamId: 1,
        durationMinutes: 0,
        start: '2026-10-30 12:00:00',
      }),
    /duração recusada/,
  )
})
