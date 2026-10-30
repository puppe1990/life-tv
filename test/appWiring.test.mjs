import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { beforeEach, test } from 'node:test'
import { JSDOM } from 'jsdom'

const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8')

function mountApp() {
  const dom = new JSDOM(html, { url: 'http://localhost/' })
  globalThis.document = dom.window.document
  globalThis.window = dom.window
  globalThis.localStorage = dom.window.localStorage
  return dom
}

function settle(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

beforeEach(() => {
  mountApp()
})

test('boot em demo desenha a home e as abas', async () => {
  await import(`../web/app.js?t=${Date.now()}`)
  await settle()
  const tiles = document.querySelectorAll('#home [data-tile]')
  assert.equal(tiles.length, 4)
  assert.match(document.getElementById('tab-inicio').className, /text-accent/)
})

test('clicar na aba Live TV abre o catálogo com itens', async () => {
  await import(`../web/app.js?t=${Date.now()}`)
  await settle()
  document.getElementById('tab-live').click()
  await settle()
  assert.equal(document.getElementById('catalog').hidden, false)
  assert.ok(document.querySelectorAll('#categories li').length >= 1)
  assert.ok(document.querySelectorAll('#items li').length >= 1)
  assert.match(document.getElementById('tab-live').className, /text-accent/)
})

test('clicar no tile Ao vivo também abre o catálogo', async () => {
  await import(`../web/app.js?t=${Date.now()}`)
  await settle()
  document.querySelector('#home [data-tile="live"]').click()
  await settle()
  assert.equal(document.getElementById('catalog').hidden, false)
})
