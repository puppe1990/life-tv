import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createXtreamClient } from '../src/xtreamClient.mjs'
import { createDemoFetch, DEMO_PLAYLIST } from '../src/demoPortal.mjs'
import { createFakeXtreamPortal } from '../src/fakeXtreamPortal.mjs'
import { liveStreamUrl } from '../src/xtreamUrls.mjs'
import {
  faker,
  fakerCategory,
  fakerLiveStream,
  fakerPassword,
  fakerPortal,
  fakerSeriesEntry,
  fakerUsername,
  fakerVodStream,
  fakerXtreamLogin,
} from './factories.mjs'

beforeEach(() => {
  faker.seed(49)
})

function makeXc() {
  const portal = fakerPortal({ protocol: 'http', port: 8080 })
  const username = fakerUsername()
  const password = fakerPassword()
  const login = fakerXtreamLogin({ username, password, portal, auth: 1, status: 'Active' })
  return { portal, username, password, login }
}

test('login envia User-Agent Life TV no player_api', async () => {
  const xc = makeXc()
  let seen
  const inner = createFakeXtreamPortal({
    username: xc.username,
    password: xc.password,
    login: xc.login,
  })
  const fetchFn = async (url, init) => {
    seen = init
    return inner(url)
  }
  const client = createXtreamClient({
    playlist: { kind: 'xc', portal: xc.portal, username: xc.username, password: xc.password },
    fetch: fetchFn,
  })
  await client.login()
  assert.equal(seen?.headers?.['User-Agent'], 'Life TV/0.1')
})

test('login no portal fake usa user_info do faker', async () => {
  const xc = makeXc()
  const fetchFn = createFakeXtreamPortal({
    username: xc.username,
    password: xc.password,
    login: xc.login,
  })
  const client = createXtreamClient({
    playlist: { kind: 'xc', portal: xc.portal, username: xc.username, password: xc.password },
    fetch: fetchFn,
  })
  const session = await client.login()
  assert.equal(session.username, xc.username)
  assert.equal(session.status, 'Active')
  assert.equal(session.server.host, new URL(xc.portal).hostname)
})

test('rejeita senha errada do faker via auth 0', async () => {
  const xc = makeXc()
  const fetchFn = createFakeXtreamPortal({
    username: xc.username,
    password: xc.password,
    login: xc.login,
  })
  const client = createXtreamClient({
    playlist: {
      kind: 'xc',
      portal: xc.portal,
      username: xc.username,
      password: fakerPassword(),
    },
    fetch: fetchFn,
  })
  await assert.rejects(() => client.login(), /auth/)
})

test('liveCatalog agrupa streams do faker por categoria', async () => {
  const xc = makeXc()
  const sports = fakerCategory({ id: 4, name: faker.commerce.department() })
  const a = fakerLiveStream({ categoryId: 4 })
  const b = fakerLiveStream({ categoryId: 4 })
  const fetchFn = createFakeXtreamPortal({
    username: xc.username,
    password: xc.password,
    login: xc.login,
    liveCategories: [sports],
    liveStreams: [a, b],
  })
  const client = createXtreamClient({
    playlist: { kind: 'xc', portal: xc.portal, username: xc.username, password: xc.password },
    fetch: fetchFn,
  })
  const catalog = await client.liveCatalog()
  assert.equal(catalog.kind, 'live')
  assert.equal(catalog.categories[0].name, sports.category_name)
  assert.equal(catalog.categories[0].items.length, 2)
  assert.equal(catalog.categories[0].items[0].id, a.stream_id)
  assert.equal(
    client.livePlayUrl(a.stream_id),
    liveStreamUrl({
      portal: xc.portal,
      username: xc.username,
      password: xc.password,
      streamId: a.stream_id,
    }),
  )
})

test('vodCatalog carrega container_extension do faker', async () => {
  const xc = makeXc()
  const cat = fakerCategory({ id: 9 })
  const vod = fakerVodStream({ categoryId: 9 })
  const fetchFn = createFakeXtreamPortal({
    username: xc.username,
    password: xc.password,
    login: xc.login,
    vodCategories: [cat],
    vodStreams: [vod],
  })
  const client = createXtreamClient({
    playlist: { kind: 'xc', portal: xc.portal, username: xc.username, password: xc.password },
    fetch: fetchFn,
  })
  const catalog = await client.vodCatalog()
  assert.equal(catalog.kind, 'vod')
  assert.equal(catalog.categories[0].items[0].extension, vod.container_extension)
})

test('seriesCatalog usa series_id do faker', async () => {
  const xc = makeXc()
  const cat = fakerCategory({ id: 5 })
  const series = fakerSeriesEntry({ categoryId: 5 })
  const fetchFn = createFakeXtreamPortal({
    username: xc.username,
    password: xc.password,
    login: xc.login,
    seriesCategories: [cat],
    series: [series],
  })
  const client = createXtreamClient({
    playlist: { kind: 'xc', portal: xc.portal, username: xc.username, password: xc.password },
    fetch: fetchFn,
  })
  const catalog = await client.seriesCatalog()
  assert.equal(catalog.kind, 'series')
  assert.equal(catalog.categories[0].items[0].id, series.series_id)
  assert.equal(catalog.categories[0].items[0].name, series.name)
})

test('demo entrega EPG curto do canal', async () => {
  const client = createXtreamClient({ playlist: DEMO_PLAYLIST, fetch: createDemoFetch() })
  const listings = await client.shortEpg(101)
  assert.equal(listings.length, 1)
  assert.equal(listings[0].title, 'Jornal da Cultura')
  assert.equal(listings[0].hasArchive, true)
})

test('demo entrega episódios da série', async () => {
  const client = createXtreamClient({ playlist: DEMO_PLAYLIST, fetch: createDemoFetch() })
  const episodes = await client.seriesEpisodes(401)
  assert.equal(episodes.length, 1)
  assert.equal(episodes[0].extension, 'mp4')
})

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

test('liveCatalog inclui user_not_found do JSON 403', async () => {
  const xc = makeXc()
  const client = createXtreamClient({
    playlist: { kind: 'xc', portal: xc.portal, username: xc.username, password: xc.password },
    fetch: async () => jsonResponse(403, { error: 'user_not_found' }),
  })
  await assert.rejects(
    () => client.liveCatalog(),
    (error) => {
      assert.match(error.message, /user_not_found/)
      assert.match(error.message, /HTTP 403/)
      assert.equal(error.message.includes(new URL(xc.portal).host), true)
      return true
    },
  )
})

test('ping aceita login 404 quando get_live_streams devolve lista', async () => {
  const xc = makeXc()
  const client = createXtreamClient({
    playlist: { kind: 'xc', portal: xc.portal, username: xc.username, password: xc.password },
    fetch: async (url) => {
      const action = new URL(url).searchParams.get('action')
      if (!action) return new Response('<html>404</html>', { status: 404 })
      if (action === 'get_live_streams') return jsonResponse(200, [])
      return jsonResponse(404, {})
    },
  })
  const session = await client.ping()
  assert.equal(session.status, 'Active')
})

test('ping recusa 403 user_not_found depois do login 404', async () => {
  const xc = makeXc()
  const client = createXtreamClient({
    playlist: { kind: 'xc', portal: xc.portal, username: xc.username, password: xc.password },
    fetch: async (url) => {
      const action = new URL(url).searchParams.get('action')
      if (!action) return new Response('<html>404</html>', { status: 404 })
      return jsonResponse(403, { error: 'user_not_found' })
    },
  })
  await assert.rejects(() => client.ping(), /user_not_found/)
})
