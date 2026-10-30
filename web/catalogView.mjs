import { filterCategories } from '../src/catalogFilter.mjs'
import { HOME_TILES } from '../src/tvShell.mjs'
import {
  actionClass,
  catCountClass,
  catItemClass,
  catListClass,
  itemClass,
  itemListClass,
  playerNoteClass,
  playerTitleClass,
  tabClass,
  tileClass,
} from '../src/tvSkin.mjs'
import { byId, el } from './dom.mjs'
import { state } from './state.mjs'
import { favStore } from './stores.mjs'
import { ensureEpg, epgBlock } from './playerView.mjs'

const TAB_SCREENS = {
  'tab-inicio': 'home',
  'tab-live': 'live',
  'tab-movies': 'movies',
  'tab-series': 'series',
  'tab-settings': 'settings',
}

/** Home, abas e catálogo em três colunas (categorias, itens, detalhe). */
export function renderHome() {
  const root = byId('home')
  root.hidden = state.shell.screen !== 'home'
  if (root.hidden) return
  root.replaceChildren(
    ...HOME_TILES.map((tile) => {
      const button = el('button', tileClass(tile.id === state.shell.homeId), tile.label)
      button.type = 'button'
      button.setAttribute('aria-selected', String(tile.id === state.shell.homeId))
      button.dataset.tile = tile.id
      return button
    }),
  )
}

export function renderTabs() {
  const { shell } = state
  const active = shell.screen === 'catalog' ? shell.catalogKind : shell.screen
  for (const [id, name] of Object.entries(TAB_SCREENS)) {
    byId(id).className = tabClass(active === name)
  }
}

function currentCategory() {
  return state.shell.catalog?.categories?.[state.shell.categoryIndex] ?? null
}

export function selectCategory(index) {
  const category = state.shell.catalog?.categories?.[index]
  if (!category) return
  state.shell = {
    ...state.shell,
    categoryIndex: index,
    itemIndex: 0,
    selectedItem: category.items[0] ?? null,
  }
  state.redraw()
}

export function selectItem(item) {
  const index = (currentCategory()?.items ?? []).findIndex((candidate) => candidate.id === item.id)
  state.shell = {
    ...state.shell,
    itemIndex: Math.max(0, index),
    selectedItem: item,
    screen: 'player',
  }
  state.redraw()
}

function renderCategories(categories) {
  const list = byId('categories')
  list.className = catListClass()
  list.replaceChildren()
  for (const category of categories) {
    const selected = category.sourceIndex === state.shell.categoryIndex
    const row = el('li', catItemClass(selected))
    row.setAttribute('aria-selected', String(selected))
    row.append(
      el('span', '', category.name),
      el('span', catCountClass(), String(category.items.length)),
    )
    row.addEventListener('click', () => selectCategory(category.sourceIndex))
    list.append(row)
  }
}

function renderItems(categories) {
  const list = byId('items')
  list.className = itemListClass()
  list.replaceChildren()
  const category = categories.find((entry) => entry.sourceIndex === state.shell.categoryIndex)
  for (const [index, item] of (category?.items ?? []).entries()) {
    const selected = item.id === state.shell.selectedItem?.id
    const row = el('li', itemClass(selected))
    row.setAttribute('aria-selected', String(selected))
    row.append(
      el('span', 'mr-4 text-mute', String(index + 1).padStart(2, '0')),
      el('span', '', item.name),
    )
    row.addEventListener('click', () => selectItem(item))
    list.append(row)
  }
}

function renderDetail() {
  const root = byId('detail')
  const item = state.shell.selectedItem
  if (!item) {
    root.replaceChildren()
    return
  }
  const nodes = [el('h2', playerTitleClass(), item.name)]
  nodes.push(
    el('p', playerNoteClass(), `#${item.id}${item.extension ? ` · ${item.extension}` : ''}`),
  )
  if (state.shell.catalogKind === 'live') {
    ensureEpg(item)
    if (state.epg.listings.length) nodes.push(epgBlock(item))
  }
  const actions = el('div', 'flex flex-wrap gap-3')
  const play = el('button', actionClass(), 'Assistir')
  play.type = 'button'
  play.addEventListener('click', () => selectItem(item))
  const fav = el(
    'button',
    actionClass(),
    favStore.isFav(item.id) ? 'Remover favorito' : 'Add to Favorite',
  )
  fav.type = 'button'
  fav.addEventListener('click', () => {
    favStore.toggleFav(item.id)
    state.redraw()
  })
  actions.append(play, fav)
  nodes.push(actions)
  root.replaceChildren(...nodes)
}

export function renderCatalog() {
  const visible = state.shell.screen === 'catalog'
  byId('catalog').hidden = !visible
  if (!visible) return
  const categories = filterCategories(state.shell.catalog?.categories, byId('search')?.value)
  renderCategories(categories)
  renderItems(categories)
  renderDetail()
}
