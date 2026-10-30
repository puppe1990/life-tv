import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { loadM3uCatalog } from '../src/loadM3uCatalog.mjs'
import { faker, fakerM3uItem, fakerM3uPlaylist, fakerPortal } from './factories.mjs'

beforeEach(() => {
  faker.seed(50)
})

test('parseia content M3U gerado pelo faker', async () => {
  const items = [fakerM3uItem(), fakerM3uItem()]
  const catalog = await loadM3uCatalog({ content: fakerM3uPlaylist(items) })
  assert.equal(catalog.items.length, 2)
  assert.equal(catalog.items[0].title, items[0].title)
  assert.equal(catalog.items[0].url, items[0].url)
})

test('baixa M3U pela URL via fetch injetável', async () => {
  const items = [fakerM3uItem()]
  const text = fakerM3uPlaylist(items)
  const url = `${fakerPortal({ protocol: 'https', port: 443 })}/list.m3u`
  const catalog = await loadM3uCatalog({
    url,
    fetch: async (requested) => {
      assert.equal(requested, url)
      return new Response(text, { status: 200 })
    },
  })
  assert.equal(catalog.items[0].group, items[0].group)
})

test('rejeita HTTP não-200 do fetch', async () => {
  const url = `${fakerPortal()}/missing.m3u`
  await assert.rejects(
    () =>
      loadM3uCatalog({
        url,
        fetch: async () => new Response('nope', { status: 404 }),
      }),
    /HTTP 404/,
  )
})
