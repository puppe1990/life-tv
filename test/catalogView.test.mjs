import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { JSDOM } from 'jsdom'
import { faker } from './factories.mjs'

const dom = new JSDOM(`<!doctype html><body>
  <section id="home"></section>
  <section id="catalog" hidden>
    <ul id="categories"></ul>
    <ul id="items"></ul>
    <aside id="detail"></aside>
  </section>
  <input id="search" value="" />
  <button id="tab-inicio"></button><button id="tab-live"></button>
  <button id="tab-movies"></button><button id="tab-series"></button>
  <button id="tab-settings"></button>
</body>`)

globalThis.document = dom.window.document

const { state } = await import('../web/state.mjs')
const { renderCatalog, renderHome, renderTabs, selectCategory, selectItem } =
  await import('../web/catalogView.mjs')
const { createTvShell } = await import('../src/tvShell.mjs')

beforeEach(() => {
  faker.seed(57)
  dom.window.document.getElementById('search').value = ''
  state.shell = createTvShell()
})

function moviesCatalog() {
  const first = { id: faker.number.int({ min: 10, max: 99 }), name: 'Alfa', extension: 'mp4' }
  const second = { id: faker.number.int({ min: 100, max: 999 }), name: 'Beta', extension: 'mkv' }
  return {
    kind: 'movies',
    categories: [{ id: '1', name: 'Ação', items: [first, second] }],
    first,
  }
}

test('home desenha os quatro tiles e marca o selecionado', () => {
  renderHome()
  const tiles = document.querySelectorAll('#home button')
  assert.equal(tiles.length, 4)
  assert.equal(tiles[0].getAttribute('aria-selected'), 'true')
  assert.equal(tiles[0].dataset.tile, 'live')
})

test('catálogo desenha categorias com contagem e itens numerados', () => {
  const { categories, first } = moviesCatalog()
  state.shell = {
    ...createTvShell(),
    screen: 'catalog',
    catalogKind: 'movies',
    catalog: { kind: 'movies', categories },
    selectedItem: first,
  }
  renderCatalog()

  const rows = document.querySelectorAll('#categories li')
  assert.equal(rows.length, 1)
  assert.match(rows[0].textContent, /Ação/)
  assert.match(rows[0].textContent, /2/)

  const items = document.querySelectorAll('#items li')
  assert.equal(items.length, 2)
  assert.match(items[0].textContent, /01/)
  assert.equal(items[0].getAttribute('aria-selected'), 'true')
})

test('detalhe mostra título, botões e marca favorito', () => {
  const { categories, first } = moviesCatalog()
  state.shell = {
    ...createTvShell(),
    screen: 'catalog',
    catalogKind: 'movies',
    catalog: { kind: 'movies', categories },
    selectedItem: first,
  }
  renderCatalog()

  const detail = document.querySelector('#detail')
  assert.match(detail.textContent, /Alfa/)
  assert.match(detail.textContent, /Assistir/)
  assert.match(detail.textContent, /Add to Favorite/)
})

test('selectCategory troca a categoria e seleciona o primeiro item', () => {
  const { categories } = moviesCatalog()
  const other = {
    id: '2',
    name: 'Drama',
    items: [{ id: faker.number.int({ min: 1000, max: 9999 }), name: 'Gama', extension: 'mp4' }],
  }
  state.shell = {
    ...createTvShell(),
    screen: 'catalog',
    catalogKind: 'movies',
    catalog: { kind: 'movies', categories: [...categories, other] },
    selectedItem: categories[0].items[0],
  }
  selectCategory(1)
  assert.equal(state.shell.categoryIndex, 1)
  assert.equal(state.shell.selectedItem.name, 'Gama')
})

test('selectItem abre o player no item escolhido', () => {
  const { categories } = moviesCatalog()
  state.shell = {
    ...createTvShell(),
    screen: 'catalog',
    catalogKind: 'movies',
    catalog: { kind: 'movies', categories },
    selectedItem: categories[0].items[0],
  }
  selectItem(categories[0].items[1])
  assert.equal(state.shell.screen, 'player')
  assert.equal(state.shell.itemIndex, 1)
})

test('abas marcam a ativa com a classe do amarelo', () => {
  state.shell = { ...createTvShell(), screen: 'catalog', catalogKind: 'movies' }
  renderTabs()
  assert.match(document.getElementById('tab-movies').className, /text-accent/)
  assert.equal(document.getElementById('tab-inicio').className.includes('text-accent'), false)
})
