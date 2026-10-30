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
import {
  catItemClass,
  catListClass,
  itemClass,
  itemListClass,
  playerNoteClass,
  playerTitleClass,
  playerUrlClass,
  tileClass,
} from '../src/tvSkin.mjs'
import { createJsonBucket } from '../src/jsonBucket.mjs'
import { resolvePlayerSource } from '../src/playerSource.mjs'
import { createResumeStore } from '../src/resumeStore.mjs'
import { createXtreamClient } from '../src/xtreamClient.mjs'

const store = createPlaylistStore()
let shell = createTvShell()
let client = demoClient()
let errorText = ''

function localStore() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

const resumeStore = createResumeStore({
  bucket: createJsonBucket({ storage: localStore(), key: 'life-tv:resume' }),
})

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
      btn.className = tileClass(tile.id === shell.homeId)
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
  cats.className = catListClass()
  const items = document.createElement('ul')
  items.className = itemListClass()
  for (const cat of shell.catalog?.categories ?? []) {
    const li = document.createElement('li')
    li.className = catItemClass()
    li.textContent = cat.name
    cats.append(li)
  }
  for (const item of shell.catalog?.categories[shell.categoryIndex]?.items ?? []) {
    const li = document.createElement('li')
    li.className = itemClass(item.id === shell.selectedItem?.id)
    li.textContent = item.name
    li.setAttribute('aria-selected', String(item.id === shell.selectedItem?.id))
    items.append(li)
  }
  root.replaceChildren(cats, items)
}

function streamIdOf(item) {
  return item ? String(item.id) : ''
}

function seekResume(video, item) {
  const saved = resumeStore.load(streamIdOf(item))
  if (saved) video.currentTime = saved.positionMs / 1000
}

function saveResume(video, item) {
  if (!Number.isFinite(video.duration)) return
  resumeStore.save({
    streamId: streamIdOf(item),
    positionMs: Math.round(video.currentTime * 1000),
    durationMs: Math.round(video.duration * 1000),
  })
}

function playerVideo(url, item) {
  const video = document.createElement('video')
  video.className = 'w-full border-2 border-line bg-black'
  video.controls = true
  video.playsInline = true
  const source = resolvePlayerSource(url, { canPlay: (type) => video.canPlayType(type) })
  if (source.kind === 'hls' || source.kind === 'progressive') {
    video.src = source.url
    video.addEventListener('loadedmetadata', () => seekResume(video, item))
    video.addEventListener('timeupdate', () => saveResume(video, item))
  }
  return { video, source }
}

function playerNote(source) {
  if (source.kind === 'hls') return 'HLS nativo do webview'
  if (source.kind === 'progressive') return 'MP4 progressivo'
  return source.reason
}

function renderPlayer() {
  const root = byId('player')
  root.hidden = shell.screen !== 'player'
  if (shell.screen !== 'player') return
  const url = playUrl()
  const item = shell.selectedItem
  const title = document.createElement('h1')
  title.className = playerTitleClass()
  title.textContent = item?.name ?? 'Sem título'
  const note = document.createElement('p')
  note.className = playerNoteClass()
  const code = document.createElement('code')
  code.className = playerUrlClass()
  code.textContent = url
  const nodes = [title]
  if (url) {
    const { video, source } = playerVideo(url, item)
    nodes.push(video)
    note.textContent = playerNote(source)
  } else {
    note.textContent = 'Séries ainda sem player'
  }
  nodes.push(note, code)
  root.replaceChildren(...nodes)
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
