import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { JSDOM } from 'jsdom'
import { faker } from './factories.mjs'

const dom = new JSDOM('<!doctype html><body></body>')
globalThis.document = dom.window.document

const { state } = await import('../web/state.mjs')
const { fillCatalog } = await import('../web/session.mjs')
const { createTvShell } = await import('../src/tvShell.mjs')

beforeEach(() => {
  faker.seed(82)
  state.redraw = () => {}
  state.featured = null
  state.errorText = ''
})

function fakeLiveCatalog() {
  return {
    kind: 'live',
    categories: [
      {
        id: String(faker.number.int({ min: 1, max: 9 })),
        name: faker.commerce.department(),
        items: [
          { id: faker.number.int({ min: 10, max: 99 }), name: faker.company.name(), icon: '' },
        ],
      },
    ],
  }
}

test('segunda abertura ao vivo não baixa de novo o catálogo fresco', async () => {
  let calls = 0
  const catalog = fakeLiveCatalog()
  state.playlistId = faker.string.alphanumeric(8)
  state.client = {
    liveCatalog: async () => {
      calls += 1
      return catalog
    },
  }
  state.shell = { ...createTvShell(), screen: 'catalog', catalogKind: 'live' }
  await fillCatalog()
  await fillCatalog()
  assert.equal(calls, 1)
  assert.equal(state.shell.catalog.kind, 'live')
})
