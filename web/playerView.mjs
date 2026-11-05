import { minutesBetween } from '../src/epgWindow.mjs'
import { attachHlsPlayback } from '../src/hlsPlayback.mjs'
import { resolvePlayerSource } from '../src/playerSource.mjs'
import { redactUrl } from '../src/xtreamUrls.mjs'
import {
  ghostClass,
  liveBadgeClass,
  playerNoteClass,
  playerTitleClass,
  playerUrlClass,
} from '../src/tvSkin.mjs'
import { epgClock, epgProgress } from '../src/epgProgress.mjs'
import { tauriInvoke, webFetch } from './bridge.mjs'
import { byId, el } from './dom.mjs'
import { playUrl, withRotation } from './session.mjs'
import { state } from './state.mjs'
import { resumeStore } from './stores.mjs'

let hlsEngine = null
let held = { url: '', video: null, session: null, frame: null, item: null }

/** Injeta o engine hls.js (webview Tauri). */
export function setHlsEngine(Hls) {
  hlsEngine = Hls
}

/** Solta o <video> preso entre renders. Só testes. */
export function resetPlayerMedia() {
  held.session?.destroy?.()
  held = { url: '', video: null, session: null, frame: null, item: null }
}

function streamIdOf(item) {
  return item ? String(item.id) : ''
}

function seekResume(video, item) {
  if (state.shell.catalogKind === 'live') return
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

function wireVideo(video) {
  video.addEventListener('loadedmetadata', () => seekResume(video, held.item))
  video.addEventListener('timeupdate', () => saveResume(video, held.item))
  video.addEventListener('error', () => {
    const code = video.error?.code ?? '?'
    state.errorText = `stream falhou (código ${code})`
    const box = byId('error')
    if (box) box.textContent = state.errorText
  })
}

function startVideo(video, url) {
  video.play().catch((error) => {
    if (error?.name === 'NotAllowedError') return
    state.errorText = `player recusou: ${error.message}`
    const box = byId('error')
    if (box) box.textContent = state.errorText
  })
  held.url = url
}

function bindHlsOrProgressive(video, url, source) {
  if (held.url === url && held.session) return source
  held.session?.destroy?.()
  held.session = null
  held.url = ''
  if (source.kind === 'progressive') {
    video.src = source.url
    held.session = { kind: 'progressive', destroy() {} }
    startVideo(video, url)
    return source
  }
  held.session = attachHlsPlayback(video, url, {
    Hls: hlsEngine,
    fetch: webFetch(),
    preferNative: !tauriInvoke(),
    canPlay: (type) => video.canPlayType(type),
    onFatalError(data) {
      state.errorText = `stream falhou (${data.type ?? 'hls'})`
      const box = byId('error')
      if (box) box.textContent = state.errorText
    },
  })
  startVideo(video, url)
  return source
}

function playerVideo(url, item) {
  held.item = item
  if (held.video && held.frame) {
    const nameEl = held.frame.querySelector('[data-player-name]')
    if (nameEl) nameEl.textContent = item?.name ?? ''
    const source = resolvePlayerSource(url, { canPlay: (type) => held.video.canPlayType(type) })
    if (source.kind === 'hls' || source.kind === 'progressive') {
      bindHlsOrProgressive(held.video, url, source)
    }
    return { video: held.video, source, frame: held.frame }
  }
  const video = el('video', 'h-full w-full bg-black object-contain')
  video.id = 'player-video'
  video.controls = true
  video.playsInline = true
  video.autoplay = true
  wireVideo(video)
  const source = resolvePlayerSource(url, { canPlay: (type) => video.canPlayType(type) })
  const frame = playerFrame(video, item)
  frame.id = 'player-frame'
  held.video = video
  held.frame = frame
  if (source.kind === 'hls' || source.kind === 'progressive') {
    bindHlsOrProgressive(video, url, source)
  }
  return { video, source, frame }
}

function playerFrame(video, item) {
  const frame = el('div', 'relative aspect-video overflow-hidden rounded-lg bg-black')
  frame.append(video)
  const top = el(
    'div',
    'pointer-events-none absolute top-0 right-0 left-0 flex items-center gap-2 bg-linear-to-b from-black/70 to-transparent p-4',
  )
  if (state.shell.catalogKind === 'live') {
    top.append(el('span', liveBadgeClass(), 'Ao vivo'))
  }
  const name = el(
    'span',
    'rounded bg-black/60 px-2 py-0.5 font-sans text-[10px] font-bold text-ink',
    item?.name ?? '',
  )
  name.dataset.playerName = '1'
  top.append(name)
  frame.append(top)
  return frame
}

function playerNote(source) {
  if (source.kind === 'hls' && held.session?.kind === 'hlsjs') return 'HLS pelo fetch do shell'
  if (source.kind === 'hls') return 'HLS nativo do webview'
  if (source.kind === 'progressive') return 'MP4 progressivo'
  return source.reason
}

function putPlayerChrome(root, before, frame, after) {
  if (frame.parentNode === root) {
    for (const child of [...root.childNodes]) {
      if (child !== frame) child.remove()
    }
    for (const node of before) root.insertBefore(node, frame)
    for (const node of after) root.append(node)
    return
  }
  root.replaceChildren(...before, frame, ...after)
}

/** Resolve a URL do primeiro episódio da série. */
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

/** Carrega o EPG curto do canal, uma vez por item. */
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

/** Lista o EPG com atalho de catch-up quando há archive. */
export function epgBlock(item) {
  const list = el('ul', 'mt-3 list-none space-y-2 p-0')
  for (const listing of state.epg.listings.slice(0, 6)) {
    const row = el('li', 'rounded-lg bg-well p-3')
    const head = el('div', 'flex items-center justify-between gap-2')
    head.append(el('span', 'truncate font-display text-sm font-bold text-ink', listing.title))
    head.append(
      el('span', 'shrink-0 font-sans text-[10px] font-bold text-mute', epgClock(listing.start)),
    )
    row.append(head)
    const track = el('div', 'mt-2 h-1 overflow-hidden rounded-full bg-panel')
    const fill = el('div', 'h-full bg-accent')
    fill.style.width = `${Math.round(epgProgress(listing) * 100)}%`
    track.append(fill)
    row.append(track)
    if (listing.hasArchive) {
      const button = el('button', `${ghostClass()} mt-2`, 'Assistir do início')
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
  const button = el('button', ghostClass(), 'Abrir no player')
  button.type = 'button'
  button.addEventListener('click', () => openSidecar(url))
  return button
}

/** Desenha a tela do player com vídeo, nota e URL. */
export function renderPlayer() {
  const root = byId('player')
  const visible = state.shell.screen === 'player'
  root.hidden = !visible
  if (!visible) {
    held.video?.pause()
    return
  }
  const item = state.shell.selectedItem
  const url = playUrl()
  const title = el('h1', playerTitleClass(), item?.name ?? 'Sem título')
  const note = el('p', playerNoteClass())
  const before = [title]
  const after = []
  let frame = null
  if (url) {
    const media = playerVideo(url, item)
    if (media.source.kind === 'hls' || media.source.kind === 'progressive') frame = media.frame
    if (media.source.kind === 'sidecar' || tauriInvoke()) after.push(sidecarButton(url))
    note.textContent = playerNote(media.source)
  } else if (state.shell.catalogKind === 'series') {
    ensureSeriesUrl(item)
    note.textContent = 'Carregando episódios…'
  } else {
    note.textContent = 'Sem URL para este item'
  }
  if (state.shell.catalogKind === 'live' && item) {
    ensureEpg(item)
    if (state.epg.listings.length) after.push(epgBlock(item))
  }
  after.push(note, el('code', playerUrlClass(), redactUrl(url)))
  if (frame) putPlayerChrome(root, before, frame, after)
  else root.replaceChildren(...before, ...after)
}
