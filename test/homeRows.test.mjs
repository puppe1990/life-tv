import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { JSDOM } from 'jsdom'
import { faker } from './factories.mjs'

const dom = new JSDOM('<!doctype html><body></body>')
globalThis.document = dom.window.document

const { renderHomeRows } = await import('../web/homeRows.mjs')

beforeEach(() => {
  faker.seed(93)
})

function liveCard(name) {
  return {
    streamId: String(faker.number.int({ min: 100, max: 9999 })),
    name,
    catalogKind: 'live',
    icon: '',
  }
}

test('omite as fileiras quando histórico e favoritos estão vazios', () => {
  const nodes = renderHomeRows({ history: [], favs: [], onOpen() {} })
  assert.equal(nodes.length, 0)
})

test('desenha Continuar assistindo na ordem do histórico', () => {
  const history = [liveCard('A Fazenda 18'), liveCard('ESPN 1 HD')]
  const root = document.createElement('div')
  root.append(...renderHomeRows({ history, favs: [], onOpen() {} }))
  assert.match(root.textContent, /Continuar assistindo/)
  assert.match(root.textContent, /A Fazenda 18/)
  assert.match(root.textContent, /ESPN 1 HD/)
  const cards = root.querySelectorAll('[data-home-card="history"]')
  assert.equal(cards.length, 2)
  assert.equal(cards[0].textContent.includes('A Fazenda 18'), true)
})

test('desenha Favoritos numa fileira à parte', () => {
  const favs = [liveCard('Band Sports')]
  const root = document.createElement('div')
  root.append(...renderHomeRows({ history: [], favs, onOpen() {} }))
  assert.match(root.textContent, /Favoritos/)
  assert.match(root.textContent, /Band Sports/)
  assert.equal(root.querySelector('[data-home-card="fav"]').dataset.streamId, favs[0].streamId)
})

test('clique no card chama onOpen com o retrato', () => {
  const card = liveCard('ESPN 1 HD')
  const opened = []
  const root = document.createElement('div')
  root.append(
    ...renderHomeRows({ history: [card], favs: [], onOpen: (entry) => opened.push(entry) }),
  )
  root.querySelector('[data-home-card="history"]').click()
  assert.equal(opened.length, 1)
  assert.equal(opened[0].name, 'ESPN 1 HD')
  assert.equal(opened[0].streamId, card.streamId)
})
