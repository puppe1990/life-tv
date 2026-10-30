import { discoverPortal } from '../src/discoverPortal.mjs'
import { createDemoFetch, DEMO_PLAYLIST } from '../src/demoPortal.mjs'
import { restorePlaylist } from '../src/playlistSecret.mjs'
import { bindCatalog, createTvShell } from '../src/tvShell.mjs'
import { createXtreamClient } from '../src/xtreamClient.mjs'
import { byId } from './dom.mjs'
import { readSecret, readSeed, saveSecret, webFetch } from './bridge.mjs'
import { clearError, setError, state } from './state.mjs'
import { playlistStore } from './stores.mjs'

export function demoClient() {
  return createXtreamClient({ playlist: DEMO_PLAYLIST, fetch: createDemoFetch() })
}

export function catalogFor(kind) {
  if (kind === 'live') return state.client.liveCatalog()
  if (kind === 'movies') return state.client.vodCatalog()
  if (kind === 'series') return state.client.seriesCatalog()
  throw new Error(`catálogo recusado: recebido ${kind}, esperado live, movies ou series`)
}

export function playUrl() {
  const { shell, client, series } = state
  const item = shell.selectedItem
  if (!item) return ''
  if (shell.catalogKind === 'live') return client.livePlayUrl(item.id)
  if (shell.catalogKind === 'movies') return client.moviePlayUrl(item.id, item.extension)
  if (shell.catalogKind === 'series' && series.key === String(item.id)) return series.url
  return ''
}

export function candidatesOf() {
  const typed = (byId('plCandidates')?.value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const saved = playlistStore.list().map((item) => item.portal)
  return [...typed, ...saved].filter(Boolean)
}

async function rotatePortal() {
  const saved = playlistStore.list().find((item) => item.kind === 'xc')
  if (!saved) return null
  const password = saved.password ?? (await readSecret(saved.id))
  if (!password) return null
  const found = await discoverPortal({
    candidates: candidatesOf(),
    username: saved.username,
    password,
    fetch: webFetch(),
  })
  if (!found.portal) return null
  state.client = createXtreamClient({
    playlist: restorePlaylist({ ...saved, portal: found.portal }, password),
    fetch: webFetch(),
  })
  return found.portal
}

export async function withRotation(run) {
  try {
    return await run()
  } catch (error) {
    const rotated = await rotatePortal()
    if (!rotated) throw error
    setError(`Portal trocado para ${rotated}`)
    return run()
  }
}

export async function fillCatalog() {
  try {
    clearError()
    state.shell = bindCatalog(
      state.shell,
      await withRotation(() => catalogFor(state.shell.catalogKind)),
    )
  } catch (error) {
    setError(error.message)
  }
}

export function startDemo() {
  state.client = demoClient()
  clearError()
  state.shell = createTvShell()
  state.redraw()
}

export async function savePlaylist(event) {
  event.preventDefault()
  try {
    const playlist = playlistStore.add({
      kind: 'xc',
      name: byId('plName').value,
      portal: byId('plPortal').value,
      username: byId('plUser').value,
      password: byId('plPass').value,
    })
    const stored = await saveSecret(playlist.id, playlist.password)
    state.client = createXtreamClient({ playlist, fetch: webFetch() })
    state.errorText = stored ? '' : 'Senha não foi salva: será pedida a cada abertura.'
    state.shell = createTvShell()
    state.redraw()
  } catch (error) {
    setError(error.message)
  }
}

function explainFailure(attempts) {
  const first = attempts.find((item) => item.error)
  const reason = first ? `${first.portal}: ${first.error}` : 'sem resposta'
  return `Nenhum portal aceitou (${attempts.length} tentativas). ${reason}`
}

export async function discover() {
  const typed = byId('plCandidates')
    .value.split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const saved = playlistStore.list().map((item) => item.portal)
  try {
    const found = await discoverPortal({
      candidates: typed.length ? typed : saved,
      username: byId('plUser').value,
      password: byId('plPass').value,
      fetch: webFetch(),
    })
    if (!found.portal) {
      setError(explainFailure(found.attempts))
      return
    }
    byId('plPortal').value = found.portal
    setError(`Portal encontrado: ${found.portal}`)
  } catch (error) {
    setError(error.message)
  }
}

export async function hydrateSettingsForm(playlist) {
  if (playlist) {
    byId('plName').value = playlist.name ?? ''
    byId('plPortal').value = playlist.portal ?? ''
    byId('plUser').value = playlist.username ?? ''
    byId('plPass').placeholder = 'senha guardada localmente'
  }
  const seed = await readSeed()
  if (Array.isArray(seed?.candidates)) byId('plCandidates').value = seed.candidates.join('\n')
}

export async function bootSeed() {
  const seed = await readSeed()
  if (!seed || !seed.username) return false
  const password = await readSecret('seed')
  if (!password) return false
  const playlist = playlistStore.add({
    kind: 'xc',
    name: seed.name ?? 'Casa',
    portal: seed.portal,
    username: seed.username,
    password,
  })
  await saveSecret(playlist.id, password)
  clearError()
  await hydrateSettingsForm(playlist)
  state.client = createXtreamClient({ playlist, fetch: webFetch() })
  state.shell = createTvShell()
  state.redraw()
  return true
}

export async function bootSaved() {
  for (const saved of playlistStore.list()) {
    if (saved.kind !== 'xc') continue
    const password = saved.password ?? (await readSecret(saved.id))
    if (!password) continue
    state.client = createXtreamClient({
      playlist: saved.password ? saved : restorePlaylist(saved, password),
      fetch: webFetch(),
    })
    await hydrateSettingsForm(saved)
    state.shell = createTvShell()
    state.redraw()
    return true
  }
  return false
}
