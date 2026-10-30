import { createPlaylistStore } from '../src/addPlaylist.mjs'
import { createDemoFetch, DEMO_PLAYLIST } from '../src/demoPortal.mjs'
import {
  bindCatalog,
  createTvShell,
  focusHome,
  handleKey,
  HOME_TILES,
  openHomeTile,
} from '../src/tvShell.mjs'
import { createXtreamClient } from '../src/xtreamClient.mjs'

const store = createPlaylistStore()
let shell = createTvShell()
let client = demoClient()
let errorText = ''

function demoClient() {
  return createXtreamClient({ playlist: DEMO_PLAYLIST, fetch: createDemoFetch() })
}

function byId(id) {
  return document.getElementById(id)
}

function catalogFor(kind) {
  if (kind === 'live') return client.liveCatalog()
  if (kind === 'movies') return client.vodCatalog()
  if (kind === 'series') return client.seriesCatalog()
  throw new Error(`catálogo recusado: recebido ${kind}, esperado live, movies ou series`)
}

function playUrl() {
  const item = shell.selectedItem
  if (!item) return ''
  if (shell.catalogKind === 'live') return client.livePlayUrl(item.id)
  if (shell.catalogKind === 'movies') return client.moviePlayUrl(item.id, item.extension)
  return ''
}

async function fillCatalog() {
  try {
    errorText = ''
    shell = bindCatalog(shell, await catalogFor(shell.catalogKind))
  } catch (err) {
    errorText = err.message
  }
}

function renderHome() {
  const root = byId('home')
  root.hidden = shell.screen !== 'home'
  if (shell.screen !== 'home') return
  root.replaceChildren(
    ...HOME_TILES.map((tile) => {
      const btn = document.createElement('button')
      btn.className = 'tile'
      btn.type = 'button'
      btn.textContent = tile.label
      btn.setAttribute('aria-selected', String(tile.id === shell.homeId))
      btn.addEventListener('click', () => void onTile(tile.id))
      return btn
    }),
  )
}

function renderCatalog() {
  const root = byId('catalog')
  root.hidden = shell.screen !== 'catalog'
  if (shell.screen !== 'catalog') return
  const cats = document.createElement('ul')
  cats.className = 'cats'
  const items = document.createElement('ul')
  items.className = 'items'
  for (const cat of shell.catalog?.categories ?? []) {
    const li = document.createElement('li')
    li.textContent = cat.name
    cats.append(li)
  }
  for (const item of shell.catalog?.categories[shell.categoryIndex]?.items ?? []) {
    const li = document.createElement('li')
    li.textContent = item.name
    li.setAttribute('aria-selected', String(item.id === shell.selectedItem?.id))
    items.append(li)
  }
  root.replaceChildren(cats, items)
}

function renderPlayer() {
  const root = byId('player')
  root.hidden = shell.screen !== 'player'
  if (shell.screen !== 'player') return
  const title = document.createElement('h1')
  title.textContent = shell.selectedItem?.name ?? 'Sem título'
  const note = document.createElement('p')
  note.textContent = 'URL montada localmente. O sidecar mpv entra no Tauri.'
  const code = document.createElement('code')
  code.textContent = playUrl()
  root.replaceChildren(title, note, code)
}

function renderSettings() {
  byId('settings').hidden = shell.screen !== 'settings'
}

function render() {
  renderHome()
  renderCatalog()
  renderPlayer()
  renderSettings()
  byId('error').textContent = errorText
}

async function applyShell(next) {
  if (next === shell) return
  shell = next
  if (shell.screen === 'catalog' && !shell.catalog) await fillCatalog()
  render()
}

async function onTile(id) {
  await applyShell(openHomeTile(focusHome(shell, id)))
}

async function onKey(event) {
  if (event.target.matches('input, textarea') && event.key !== 'Escape') return
  const next = handleKey(shell, event.key)
  if (next === shell) return
  event.preventDefault()
  await applyShell(next)
}

function bootDemo() {
  client = demoClient()
  errorText = ''
  shell = createTvShell()
  render()
}

function savePlaylist(event) {
  event.preventDefault()
  try {
    const playlist = store.add({
      kind: 'xc',
      name: byId('plName').value,
      portal: byId('plPortal').value,
      username: byId('plUser').value,
      password: byId('plPass').value,
    })
    client = createXtreamClient({ playlist, fetch: globalThis.fetch.bind(globalThis) })
    errorText = ''
    shell = createTvShell()
    render()
  } catch (err) {
    errorText = err.message
    render()
  }
}

function boot() {
  document.addEventListener('keydown', onKey)
  byId('demoBtn').addEventListener('click', bootDemo)
  byId('playlistForm').addEventListener('submit', savePlaylist)
  bootDemo()
}

boot()
