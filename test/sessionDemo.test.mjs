import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { JSDOM } from 'jsdom'
import { faker } from './factories.mjs'

const dom = new JSDOM('<!doctype html><body><section id="home"></section></body>')
globalThis.document = dom.window.document

const { state } = await import('../web/state.mjs')
const { startDemo } = await import('../web/session.mjs')

beforeEach(() => {
  faker.seed(58)
  state.redraw = () => {}
  state.featured = null
})

function settle() {
  return new Promise((resolve) => setTimeout(resolve, 50))
}

test('demo pré-carrega o catálogo e destaca o primeiro canal', async () => {
  startDemo()
  await settle()
  assert.equal(state.featured.kind, 'live')
  assert.equal(state.featured.name, 'TV Cultura')
})

test('demo começa na home com o cliente pronto', () => {
  startDemo()
  assert.equal(state.shell.screen, 'home')
  assert.ok(state.client)
})
