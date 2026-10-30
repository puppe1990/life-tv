import { createTvShell, focusHome, handleKey, openHomeTile } from '../src/tvShell.mjs'
import { byId } from './dom.mjs'
import { renderAll } from './render.mjs'
import { bootSaved, bootSeed, discover, fillCatalog, savePlaylist, startDemo } from './session.mjs'
import { setRedraw, state } from './state.mjs'
import { playlistStore } from './stores.mjs'

setRedraw(renderAll)

async function applyShell(next) {
  if (next === state.shell) return
  state.shell = next
  if (state.shell.screen === 'catalog' && !state.shell.catalog) await fillCatalog()
  renderAll()
}

async function onTile(id) {
  await applyShell(openHomeTile(focusHome(state.shell, id)))
}

function goToScreen({ screen, catalogKind = null }) {
  if (screen === 'home') {
    state.shell = createTvShell()
    renderAll()
    return
  }
  void onTile(screen === 'settings' ? 'settings' : catalogKind)
}

async function onKey(event) {
  if (event.target.matches('input, textarea') && event.key !== 'Escape') return
  const next = handleKey(state.shell, event.key)
  if (next === state.shell) return
  event.preventDefault()
  await applyShell(next)
}

function wireHomeTiles() {
  byId('home').addEventListener('click', (event) => {
    const tile = event.target.closest('[data-tile]')
    if (tile) void onTile(tile.dataset.tile)
  })
}

function wireTabs() {
  for (const id of ['tab-inicio', 'tab-live', 'tab-movies', 'tab-series', 'tab-settings']) {
    byId(id).addEventListener('click', () => {
      const button = byId(id)
      if (button.dataset.catalog) {
        goToScreen({ screen: 'catalog', catalogKind: button.dataset.catalog })
        return
      }
      goToScreen({ screen: button.dataset.screen })
    })
  }
}

async function boot() {
  document.addEventListener('keydown', onKey)
  byId('demoBtn').addEventListener('click', startDemo)
  byId('discoverBtn').addEventListener('click', discover)
  byId('playlistForm').addEventListener('submit', savePlaylist)
  byId('search').addEventListener('input', renderAll)
  wireHomeTiles()
  wireTabs()
  if (await bootSaved()) return
  if (await bootSeed()) return
  startDemo()
  if (playlistStore.list().length > 0) {
    state.errorText = 'Playlist salva sem senha guardada: cadastre de novo.'
  }
  renderAll()
}

boot()
