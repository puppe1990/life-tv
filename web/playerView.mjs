import { minutesBetween } from '../src/epgWindow.mjs'
import { resolvePlayerSource } from '../src/playerSource.mjs'
import { redactUrl } from '../src/xtreamUrls.mjs'
import { playerNoteClass, playerTitleClass, playerUrlClass } from '../src/tvSkin.mjs'
import { tauriInvoke } from './bridge.mjs'
import { byId, el } from './dom.mjs'
import { playUrl, withRotation } from './session.mjs'
import { state } from './state.mjs'
import { resumeStore } from './stores.mjs'

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
  const video = el('video', 'w-full border-2 border-line bg-black')
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

export function ensureSeriesUrl(item) {
  const key = String(item.id)
  if (state.series.key === key) return
  state.series = { key, url: '' }
  withRotation(() => state.client.seriesEpisodes(item.id))
    .then((episodes) => {
      const first = episodes[0]
      state.series = {
        key,
        url: first ? state.client.seriesPlayUrl(first.id, first.extension) : '',
      }
    })
    .catch((error) => {
      state.errorText = error.message
    })
    .finally(() => state.redraw())
}

export function ensureEpg(item) {
  const key = String(item.id)
  if (state.epg.key === key) return
  state.epg = { key, listings: [] }
  withRotation(() => state.client.shortEpg(item.id))
    .then((listings) => {
      state.epg = { key, listings }
    })
    .catch(() => {})
    .finally(() => state.redraw())
}

function openCatchUp(item, listing) {
  try {
    const url = state.client.catchUpUrl({
      streamId: item.id,
      durationMinutes: minutesBetween(listing.start, listing.stop),
      start: listing.start,
    })
    const video = byId('player').querySelector('video')
    if (!video) return
    video.src = url
    video.play().catch(() => {})
  } catch (error) {
    state.errorText = error.message
    state.redraw()
  }
}

export function epgBlock(item) {
  const list = el('ul', 'list-none p-0 text-[20px] text-mute')
  for (const listing of state.epg.listings.slice(0, 6)) {
    const row = el('li', '', `${listing.start} · ${listing.title}`)
    if (listing.hasArchive) {
      const button = el(
        'button',
        'ml-4 cursor-pointer border border-accent px-2 text-accent',
        'Assistir do início',
      )
      button.type = 'button'
      button.addEventListener('click', () => openCatchUp(item, listing))
      row.append(button)
    }
    list.append(row)
  }
  return list
}

function openSidecar(url) {
  const invoke = tauriInvoke()
  if (!invoke) {
    state.errorText = 'player externo só existe no shell Tauri'
    state.redraw()
    return
  }
  invoke('play_sidecar', { url }).catch((error) => {
    state.errorText = `player externo recusou: ${error}`
    state.redraw()
  })
}

function sidecarButton(url) {
  const button = el(
    'button',
    'cursor-pointer border border-accent px-6 py-3 text-[22px] text-accent',
    'Abrir no player',
  )
  button.type = 'button'
  button.addEventListener('click', () => openSidecar(url))
  return button
}

export function renderPlayer() {
  const root = byId('player')
  root.hidden = state.shell.screen !== 'player'
  if (root.hidden) return
  const item = state.shell.selectedItem
  const url = playUrl()
  const note = el('p', playerNoteClass())
  const nodes = [el('h1', playerTitleClass(), item?.name ?? 'Sem título')]
  if (url) {
    const { video, source } = playerVideo(url, item)
    if (source.kind === 'hls' || source.kind === 'progressive') nodes.push(video)
    if (source.kind === 'sidecar') nodes.push(sidecarButton(url))
    note.textContent = playerNote(source)
  } else if (state.shell.catalogKind === 'series') {
    ensureSeriesUrl(item)
    note.textContent = 'Carregando episódios…'
  } else {
    note.textContent = 'Sem URL para este item'
  }
  if (state.shell.catalogKind === 'live' && item) {
    ensureEpg(item)
    if (state.epg.listings.length) nodes.push(epgBlock(item))
  }
  nodes.push(note, el('code', playerUrlClass(), redactUrl(url)))
  root.replaceChildren(...nodes)
}
