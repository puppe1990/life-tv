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

let shell = createTvShell()
let client = demoClient()
let errorText = ''

function tauriFetch() {
  const http = globalThis.__TAURI__?.http
  return typeof http?.fetch === 'function' ? http.fetch : null
}

function localStore() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

const store = createPlaylistStore({
  bucket: createJsonBucket({ storage: localStore(), key: 'life-tv:playlists' }),
})

const resumeStore = createResumeStore({
  bucket: createJsonBucket({ storage: localStore(), key: 'life-tv:resume' }),
})

let seriesState = { key: '', url: '' }
let epgState = { key: '', listings: [] }

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
  if (shell.catalogKind === 'series' && seriesState.key === String(item.id)) return seriesState.url
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

function ensureSeriesUrl(item) {
  const key = String(item.id)
  if (seriesState.key === key) return
  seriesState = { key, url: '' }
  client
    .seriesEpisodes(item.id)
    .then((episodes) => {
      const first = episodes[0]
      seriesState = { key, url: first ? client.seriesPlayUrl(first.id, first.extension) : '' }
    })
    .catch((err) => {
      errorText = err.message
    })
    .finally(render)
}

function ensureEpg(item) {
  const key = String(item.id)
  if (epgState.key === key) return
  epgState = { key, listings: [] }
  client
    .shortEpg(item.id)
    .then((listings) => {
      epgState = { key, listings }
    })
    .catch(() => {})
    .finally(render)
}

function minutesBetween(start, stop) {
  const from = new Date(start.replace(' ', 'T')).getTime()
  const to = new Date(stop.replace(' ', 'T')).getTime()
  return Math.max(1, Math.round((to - from) / 60_000))
}

function openCatchUp(item, listing) {
  try {
    const url = client.catchUpUrl({
      streamId: item.id,
      durationMinutes: minutesBetween(listing.start, listing.stop),
      start: listing.start,
    })
    const video = byId('player').querySelector('video')
    if (!video) return
    video.src = url
    video.play().catch(() => {})
  } catch (err) {
    errorText = err.message
    render()
  }
}

function epgBlock(item) {
  const list = document.createElement('ul')
  list.className = 'list-none p-0 text-[20px] text-mute'
  for (const listing of epgState.listings.slice(0, 6)) {
    const row = document.createElement('li')
    row.textContent = `${listing.start} · ${listing.title}`
    if (listing.hasArchive) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'ml-4 cursor-pointer border-2 border-brass px-2 text-brass'
      button.textContent = 'Assistir do início'
      button.addEventListener('click', () => openCatchUp(item, listing))
      row.append(button)
    }
    list.append(row)
  }
  return list
}

function sidecarButton(url) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'cursor-pointer border-2 border-brass px-4 py-2 text-2xl text-brass'
  button.textContent = 'Abrir no mpv'
  button.addEventListener('click', () => openSidecar(url))
  return button
}

function openSidecar(url) {
  const invoke = globalThis.__TAURI__?.core?.invoke
  if (typeof invoke !== 'function') {
    errorText = 'mpv só existe no shell Tauri'
    render()
    return
  }
  invoke('play_sidecar', { url }).catch((err) => {
    errorText = `mpv recusou: ${err}`
    render()
  })
}

function renderPlayer() {
  const root = byId('player')
  root.hidden = shell.screen !== 'player'
  if (shell.screen !== 'player') return
  const item = shell.selectedItem
  const url = playUrl()
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
    if (source.kind === 'hls' || source.kind === 'progressive') nodes.push(video)
    if (source.kind === 'sidecar') nodes.push(sidecarButton(url))
    note.textContent = playerNote(source)
  } else if (shell.catalogKind === 'series') {
    ensureSeriesUrl(item)
    note.textContent = 'Carregando episódios…'
  } else {
    note.textContent = 'Sem URL para este item'
  }
  if (shell.catalogKind === 'live' && item) {
    ensureEpg(item)
    if (epgState.listings.length) nodes.push(epgBlock(item))
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
    client = createXtreamClient({
      playlist,
      fetch: tauriFetch() ?? globalThis.fetch.bind(globalThis),
    })
    errorText = ''
    shell = createTvShell()
    render()
  } catch (err) {
    errorText = err.message
    render()
  }
}

function bootSaved() {
  const [saved] = store.list()
  if (!saved || saved.kind !== 'xc') return false
  client = createXtreamClient({
    playlist: saved,
    fetch: tauriFetch() ?? globalThis.fetch.bind(globalThis),
  })
  shell = createTvShell()
  render()
  return true
}

function boot() {
  document.addEventListener('keydown', onKey)
  byId('demoBtn').addEventListener('click', bootDemo)
  byId('playlistForm').addEventListener('submit', savePlaylist)
  if (!bootSaved()) bootDemo()
}

boot()
