import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { JSDOM } from 'jsdom'
import {
  faker,
  fakerM3uItem,
  fakerM3uPlaylist,
  fakerPlaylistName,
  fakerPortal,
} from './factories.mjs'

const markup = `<form id="playlistForm">
  <input id="plName" />
  <input id="plM3u" />
  <input id="plPortal" />
  <input id="plUser" />
  <input id="plPass" />
  <textarea id="plCandidates"></textarea>
</form>
<p id="error"></p>`

const dom = new JSDOM(`<!doctype html><body>${markup}</body>`, { url: 'http://localhost/' })
globalThis.document = dom.window.document
globalThis.window = dom.window
globalThis.localStorage = dom.window.localStorage

const { state } = await import('../web/state.mjs')
const { saveM3uPlaylist } = await import('../web/session.mjs')

beforeEach(() => {
  faker.seed(62)
  localStorage.clear()
  state.redraw = () => {}
  state.client = null
  document.getElementById('plName').value = ''
  document.getElementById('plM3u').value = ''
})

test('guardar M3U cria cliente que lê o catálogo via fetch', async () => {
  const item = fakerM3uItem()
  const url = `${fakerPortal({ protocol: 'https', port: 443 })}/list.m3u`
  document.getElementById('plName').value = fakerPlaylistName()
  document.getElementById('plM3u').value = url
  globalThis.fetch = async (requested) => {
    assert.equal(requested, url)
    return new Response(fakerM3uPlaylist([item]), { status: 200 })
  }
  await saveM3uPlaylist({ preventDefault() {} })
  const catalog = await state.client.liveCatalog()
  assert.equal(catalog.kind, 'live')
  assert.equal(catalog.categories[0].items[0].name, item.title)
  assert.equal(state.client.livePlayUrl(catalog.categories[0].items[0].id), item.url)
})
