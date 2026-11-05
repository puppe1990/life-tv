import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { JSDOM } from 'jsdom'
import { faker } from './factories.mjs'
import { createTvShell } from '../src/tvShell.mjs'

const HLS_TYPE = 'application/vnd.apple.mpegurl'
const plays = []

const dom = new JSDOM(`<!doctype html><body>
  <section id="player" hidden></section>
</body>`)

globalThis.document = dom.window.document
globalThis.window = dom.window
dom.window.HTMLVideoElement.prototype.canPlayType = function canPlayType(type) {
  return type === HLS_TYPE ? 'maybe' : ''
}
dom.window.HTMLVideoElement.prototype.play = function play() {
  plays.push(this.getAttribute('src') || this.src)
  return Promise.resolve()
}

const { state } = await import('../web/state.mjs')
const { renderPlayer, resetPlayerMedia, setHlsEngine } = await import('../web/playerView.mjs')

beforeEach(() => {
  faker.seed(61)
  plays.length = 0
  state.shell = createTvShell()
  state.client = null
  state.errorText = ''
  state.epg = { key: '', listings: [] }
  resetPlayerMedia()
  setHlsEngine(null)
  delete globalThis.__TAURI__
})

function liveUrl() {
  return `http://${faker.internet.domainName()}/live/user/pass/1658633.m3u8`
}

function openFla(url = liveUrl()) {
  state.client = { livePlayUrl: () => url, shortEpg: async () => [] }
  state.shell = {
    ...createTvShell(),
    screen: 'player',
    catalogKind: 'live',
    selectedItem: { id: 1658633, name: 'FLA X GRE 19:30 SD' },
  }
  return url
}

test('player HLS liga autoplay e dispara play', () => {
  const url = openFla()
  renderPlayer()
  const video = document.querySelector('#player video')
  assert.ok(video)
  assert.equal(video.autoplay, true)
  assert.equal(plays.length, 1)
  assert.equal(plays[0], url)
})

test('segundo render com EPG reusa o mesmo video e não chama play de novo', () => {
  const url = openFla()
  renderPlayer()
  const first = document.querySelector('#player video')
  state.epg = {
    key: '1658633',
    listings: [
      {
        title: 'Informações Diárias',
        start: '2026-11-04 00:00:00',
        stop: '2026-11-04 01:00:00',
        hasArchive: false,
      },
    ],
  }
  renderPlayer()
  const second = document.querySelector('#player video')
  assert.equal(second, first)
  assert.equal(plays.length, 1)
  assert.equal(plays[0], url)
  assert.match(document.querySelector('#player').textContent, /Informações Diárias/)
})

test('no Tauri o HLS vai pelo hls.js e não coloca o http no src', () => {
  const url = openFla()
  const loads = []
  class FakeHls {
    static isSupported() {
      return true
    }
    loadSource(href) {
      loads.push(href)
    }
    attachMedia() {}
    destroy() {}
  }
  globalThis.__TAURI__ = { core: { invoke: async () => {} } }
  setHlsEngine(FakeHls)
  renderPlayer()
  const video = document.querySelector('#player video')
  assert.equal(loads[0], url)
  assert.equal(video.getAttribute('src'), null)
  assert.match(document.querySelector('#player').textContent, /fetch do shell/)
})
