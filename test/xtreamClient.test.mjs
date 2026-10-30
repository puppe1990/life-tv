import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createXtreamClient } from '../src/xtreamClient.mjs'
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
