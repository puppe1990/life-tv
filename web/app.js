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
  actionClass,
  catCountClass,
  catItemClass,
  catListClass,
  itemClass,
  itemListClass,
  playerNoteClass,
  playerTitleClass,
  playerUrlClass,
  tabClass,
  tileClass,
} from '../src/tvSkin.mjs'
import { createFavLockStore } from '../src/favLockStore.mjs'
import { discoverPortal } from '../src/discoverPortal.mjs'
import { createJsonBucket } from '../src/jsonBucket.mjs'
import { redactPlaylist, restorePlaylist } from '../src/playlistSecret.mjs'
import { resolvePlayerSource } from '../src/playerSource.mjs'
import { createResumeStore } from '../src/resumeStore.mjs'
import { redactUrl } from '../src/xtreamUrls.mjs'
import { createXtreamClient } from '../src/xtreamClient.mjs'

let shell = createTvShell()
let client = demoClient()
let errorText = ''

function tauriInvoke() {
  const invoke = globalThis.__TAURI__?.core?.invoke
  return typeof invoke === 'function' ? invoke : null
}

async function saveSecret(account, value) {
  const invoke = tauriInvoke()
  if (!invoke) return false
  try {
    await invoke('secret_set', { account, value })
    return true
  } catch {
    return false
  }
}

async function readSecret(account) {
  const invoke = tauriInvoke()
  if (!invoke) return null
  try {
    return await invoke('secret_get', { account })
  } catch {
    return null
  }
}

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

const playlistsBucket = createJsonBucket({ storage: localStore(), key: 'life-tv:playlists' })

const store = createPlaylistStore({
  bucket: {
    read() {
      return playlistsBucket.read()
    },
    write(items) {
      playlistsBucket.write(tauriInvoke() ? items.map(redactPlaylist) : items)
    },
  },
})

const favStore = createFavLockStore({
  bucket: createJsonBucket({ storage: localStore(), key: 'life-tv:favs' }),
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

function candidatesOf() {
  const typed = (byId('plCandidates')?.value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const saved = store.list().map((item) => item.portal)
  return [...typed, ...saved].filter(Boolean)
}

async function rotatePortal() {
  const [saved] = store.list()
  if (!saved || saved.kind !== 'xc') return null
  const password = saved.password ?? (await readSecret(saved.id))
  if (!password) return null
  const found = await discoverPortal({
    candidates: candidatesOf(),
    username: saved.username,
    password,
    fetch: tauriFetch() ?? globalThis.fetch.bind(globalThis),
  })
  if (!found.portal) return null
  client = createXtreamClient({
    playlist: restorePlaylist({ ...saved, portal: found.portal }, password),
    fetch: tauriFetch() ?? globalThis.fetch.bind(globalThis),
  })
  return found.portal
}

async function withRotation(run) {
  try {
    return await run()
  } catch (error) {
    const rotated = await rotatePortal()
    if (!rotated) throw error
    errorText = `Portal trocado para ${rotated}`
    return run()
  }
}

async function fillCatalog() {
  try {
    errorText = ''
    shell = bindCatalog(shell, await withRotation(() => catalogFor(shell.catalogKind)))
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

function goToScreen({ screen, catalogKind = null }) {
  if (screen === 'home') {
    shell = createTvShell()
    render()
    return
  }
  void onTile(screen === 'settings' ? 'settings' : catalogKind)
}

function renderTabs() {
  const active = shell.screen === 'catalog' ? shell.catalogKind : shell.screen
  const map = {
    'tab-inicio': 'home',
    'tab-live': 'live',
    'tab-movies': 'movies',
    'tab-series': 'series',
    'tab-settings': 'settings',
  }
  for (const [id, name] of Object.entries(map)) {
    byId(id).className = tabClass(active === name)
  }
}

function currentCategory() {
  return shell.catalog?.categories?.[shell.categoryIndex] ?? null
}

function onCategory(index) {
  const category = shell.catalog?.categories?.[index]
  if (!category) return
  shell = {
    ...shell,
    categoryIndex: index,
    itemIndex: 0,
    selectedItem: category.items[0] ?? null,
  }
  render()
}

function onItem(item) {
  const index = (currentCategory()?.items ?? []).findIndex((candidate) => candidate.id === item.id)
  shell = { ...shell, itemIndex: Math.max(0, index), selectedItem: item, screen: 'player' }
  render()
}

function filteredCategories() {
  const term = (byId('search')?.value ?? '').trim().toLowerCase()
  const categories = shell.catalog?.categories ?? []
  if (!term) return categories.map((category, index) => ({ ...category, sourceIndex: index }))
  return categories
    .map((category, index) => ({
      ...category,
      sourceIndex: index,
      items: category.items.filter((item) => item.name.toLowerCase().includes(term)),
    }))
    .filter((category) => category.items.length > 0)
}

function renderCategories(categories) {
  const list = byId('categories')
  list.className = catListClass()
  list.replaceChildren()
  for (const category of categories) {
    const selected = category.sourceIndex === shell.categoryIndex
    const row = document.createElement('li')
    row.className = catItemClass(selected)
    row.setAttribute('aria-selected', String(selected))
    const name = document.createElement('span')
    name.textContent = category.name
    const count = document.createElement('span')
    count.className = catCountClass()
    count.textContent = String(category.items.length)
    row.append(name, count)
    row.addEventListener('click', () => onCategory(category.sourceIndex))
    list.append(row)
  }
}

function renderItems(categories) {
  const list = byId('items')
  list.className = itemListClass()
  list.replaceChildren()
  const category = categories.find((entry) => entry.sourceIndex === shell.categoryIndex)
  for (const [index, item] of (category?.items ?? []).entries()) {
    const row = document.createElement('li')
    row.className = itemClass(item.id === shell.selectedItem?.id)
    row.setAttribute('aria-selected', String(item.id === shell.selectedItem?.id))
    const number = document.createElement('span')
    number.className = 'mr-4 text-mute'
    number.textContent = String(index + 1).padStart(2, '0')
    const name = document.createElement('span')
    name.textContent = item.name
    row.append(number, name)
    row.addEventListener('click', () => onItem(item))
    list.append(row)
  }
}

function renderDetail() {
  const root = byId('detail')
  const item = shell.selectedItem
  if (!item) {
    root.replaceChildren()
    return
  }
  const title = document.createElement('h2')
  title.className = playerTitleClass()
  title.textContent = item.name
  const meta = document.createElement('p')
  meta.className = playerNoteClass()
  meta.textContent = `#${item.id}${item.extension ? ` · ${item.extension}` : ''}`
  const nodes = [title, meta]
  if (shell.catalogKind === 'live') {
    ensureEpg(item)
    if (epgState.listings.length) nodes.push(epgBlock(item))
  }
  const actions = document.createElement('div')
  actions.className = 'flex flex-wrap gap-3'
  const fav = document.createElement('button')
  fav.type = 'button'
  fav.className = actionClass()
  fav.textContent = favStore.isFav(item.id) ? 'Remover favorito' : 'Add to Favorite'
  fav.addEventListener('click', () => {
    favStore.toggleFav(item.id)
    render()
  })
  const play = document.createElement('button')
  play.type = 'button'
  play.className = actionClass()
  play.textContent = 'Assistir'
  play.addEventListener('click', () => onItem(item))
  actions.append(play, fav)
  nodes.push(actions)
  root.replaceChildren(...nodes)
}

function renderCatalog() {
  const visible = shell.screen === 'catalog'
  byId('catalog').hidden = !visible
  if (!visible) return
  const categories = filteredCategories()
  renderCategories(categories)
  renderItems(categories)
  renderDetail()
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
  withRotation(() => client.seriesEpisodes(item.id))
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
  withRotation(() => client.shortEpg(item.id))
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
  code.textContent = redactUrl(url)
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
  renderTabs()
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

async function savePlaylist(event) {
  event.preventDefault()
  try {
    const playlist = store.add({
      kind: 'xc',
      name: byId('plName').value,
      portal: byId('plPortal').value,
      username: byId('plUser').value,
      password: byId('plPass').value,
    })
    const stored = await saveSecret(playlist.id, playlist.password)
    client = createXtreamClient({
      playlist,
      fetch: tauriFetch() ?? globalThis.fetch.bind(globalThis),
    })
    errorText = stored ? '' : 'Senha não foi salva: será pedida a cada abertura.'
    shell = createTvShell()
    render()
  } catch (err) {
    errorText = err.message
    render()
  }
}

async function discover() {
  const typed = byId('plCandidates')
    .value.split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const saved = store.list().map((item) => item.portal)
  const candidates = typed.length ? typed : saved
  try {
    const found = await discoverPortal({
      candidates,
      username: byId('plUser').value,
      password: byId('plPass').value,
      fetch: tauriFetch() ?? globalThis.fetch.bind(globalThis),
    })
    if (!found.portal) {
      const first = found.attempts.find((item) => item.error)
      const motivo = first ? `${first.portal}: ${first.error}` : 'sem resposta'
      errorText = `Nenhum portal aceitou (${found.attempts.length} tentativas). ${motivo}`
    } else {
      byId('plPortal').value = found.portal
      errorText = `Portal encontrado: ${found.portal}`
    }
  } catch (err) {
    errorText = err.message
  }
  render()
}

async function hydrateSettingsForm(playlist) {
  if (playlist) {
    byId('plName').value = playlist.name ?? ''
    byId('plPortal').value = playlist.portal ?? ''
    byId('plUser').value = playlist.username ?? ''
    byId('plPass').placeholder = 'senha guardada localmente'
  }
  const invoke = tauriInvoke()
  if (!invoke) return
  try {
    const raw = await invoke('seed_read')
    const seed = raw ? JSON.parse(raw) : null
    if (Array.isArray(seed?.candidates)) {
      byId('plCandidates').value = seed.candidates.join('\n')
    }
  } catch {
    return
  }
}

async function bootSeed() {
  const invoke = tauriInvoke()
  if (!invoke) return false
  let raw
  try {
    raw = await invoke('seed_read')
  } catch {
    return false
  }
  if (!raw) return false
  let seed
  try {
    seed = JSON.parse(raw)
  } catch {
    return false
  }
  if (!seed || !seed.username) return false
  if (Array.isArray(seed.candidates)) {
    byId('plCandidates').value = seed.candidates.join('\n')
  }
  byId('plName').value = seed.name ?? ''
  byId('plPortal').value = seed.portal ?? ''
  byId('plUser').value = seed.username ?? ''
  const password = await readSecret('seed')
  if (!password) return false
  const playlist = store.add({
    kind: 'xc',
    name: seed.name ?? 'Casa',
    portal: seed.portal,
    username: seed.username,
    password,
  })
  await saveSecret(playlist.id, password)
  errorText = ''
  await hydrateSettingsForm(playlist)
  client = createXtreamClient({
    playlist,
    fetch: tauriFetch() ?? globalThis.fetch.bind(globalThis),
  })
  shell = createTvShell()
  render()
  return true
}

async function bootSaved() {
  for (const saved of store.list()) {
    if (saved.kind !== 'xc') continue
    const password = saved.password ?? (await readSecret(saved.id))
    if (!password) continue
    client = createXtreamClient({
      playlist: saved.password ? saved : restorePlaylist(saved, password),
      fetch: tauriFetch() ?? globalThis.fetch.bind(globalThis),
    })
    await hydrateSettingsForm(saved)
    shell = createTvShell()
    render()
    return true
  }
  return false
}

async function boot() {
  document.addEventListener('keydown', onKey)
  byId('demoBtn').addEventListener('click', bootDemo)
  byId('discoverBtn').addEventListener('click', discover)
  byId('search').addEventListener('input', render)
  for (const id of ['tab-inicio', 'tab-live', 'tab-movies', 'tab-series', 'tab-settings']) {
    byId(id).addEventListener('click', () => {
      const button = byId(id)
      if (button.dataset.catalog)
        goToScreen({ screen: 'catalog', catalogKind: button.dataset.catalog })
      else goToScreen({ screen: button.dataset.screen })
    })
  }
  byId('playlistForm').addEventListener('submit', savePlaylist)
  if (await bootSaved()) return
  if (await bootSeed()) return
  bootDemo()
  if (store.list().length > 0) errorText = 'Playlist salva sem senha guardada: cadastre de novo.'
  render()
}

boot()
