import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createM3uClient } from '../src/m3uClient.mjs'
import {
  faker,
  fakerM3uItem,
  fakerM3uPlaylist,
  fakerPlaylistName,
  fakerPortal,
} from './factories.mjs'

beforeEach(() => {
  faker.seed(61)
})

test('liveCatalog agrupa itens M3U do faker por group-title', async () => {
  const sports = faker.commerce.department()
  const news = faker.commerce.department()
  const a = fakerM3uItem({ group: sports })
  const b = fakerM3uItem({ group: sports })
  const c = fakerM3uItem({ group: news })
  const url = `${fakerPortal({ protocol: 'https', port: 443 })}/list.m3u`
  const client = createM3uClient({
    playlist: { kind: 'm3u', name: fakerPlaylistName(), url },
    fetch: async (requested) => {
      assert.equal(requested, url)
      return new Response(fakerM3uPlaylist([a, b, c]), { status: 200 })
    },
  })
  const catalog = await client.liveCatalog()
  assert.equal(catalog.kind, 'live')
  assert.equal(catalog.categories.length, 2)
  assert.equal(catalog.categories[0].name, sports)
  assert.equal(catalog.categories[0].items.length, 2)
  assert.equal(catalog.categories[0].items[0].name, a.title)
  assert.equal(catalog.categories[0].items[0].icon, a.tvgLogo)
  assert.equal(catalog.categories[1].name, news)
  assert.equal(catalog.categories[1].items[0].name, c.title)
})

test('livePlayUrl devolve a URL do item M3U', async () => {
  const item = fakerM3uItem()
  const client = createM3uClient({
    playlist: { kind: 'm3u', name: fakerPlaylistName(), content: fakerM3uPlaylist([item]) },
    fetch: async () => {
      throw new Error('fetch não deveria ser chamado com content')
    },
  })
  const catalog = await client.liveCatalog()
  const id = catalog.categories[0].items[0].id
  assert.equal(client.livePlayUrl(id), item.url)
  assert.equal(catalog.categories[0].items[0].url, item.url)
})

test('vod e series do M3U vêm vazios', async () => {
  const client = createM3uClient({
    playlist: {
      kind: 'm3u',
      name: fakerPlaylistName(),
      content: fakerM3uPlaylist([fakerM3uItem()]),
    },
  })
  const vod = await client.vodCatalog()
  const series = await client.seriesCatalog()
  assert.equal(vod.kind, 'vod')
  assert.deepEqual(vod.categories, [])
  assert.equal(series.kind, 'series')
  assert.deepEqual(series.categories, [])
  assert.deepEqual(await client.shortEpg(1), [])
})

test('rejeita playlist que não é m3u', () => {
  assert.throws(
    () =>
      createM3uClient({
        playlist: { kind: 'xc', name: fakerPlaylistName() },
        fetch: async () => {},
      }),
    /kind/,
  )
})
