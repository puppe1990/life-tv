import { discoverPortal } from '../src/discoverPortal.mjs'
import { createDemoFetch, DEMO_PLAYLIST } from '../src/demoPortal.mjs'
import { restorePlaylist } from '../src/playlistSecret.mjs'
import { bindCatalog, createTvShell } from '../src/tvShell.mjs'
import { createXtreamClient } from '../src/xtreamClient.mjs'
import { DEFAULT_PLAYLIST_NAME, SECRET_PLACEHOLDER, SEED_ACCOUNT } from './config.mjs'
import { byId } from './dom.mjs'
import { readSecret, readSeed, saveSecret, webFetch } from './bridge.mjs'
import { clearError, setError, state } from './state.mjs'
import { playlistStore } from './stores.mjs'

/** Cliente Xtream apontado para o portal fake do demo. */
export function demoClient() {
  return createXtreamClient({ playlist: DEMO_PLAYLIST, fetch: createDemoFetch() })
}

/** Busca o catálogo do tipo atual no cliente. */
export function catalogFor(kind) {
  if (kind === 'live') return state.client.liveCatalog()
  if (kind === 'movies') return state.client.vodCatalog()
  if (kind === 'series') return state.client.seriesCatalog()
  throw new Error(`catálogo recusado: recebido ${kind}, esperado live, movies ou series`)
}

/** URL de reprodução do item selecionado. */
export function playUrl() {
  const { shell, client, series } = state
  const item = shell.selectedItem
  if (!item) return ''
  if (shell.catalogKind === 'live') return client.livePlayUrl(item.id)
  if (shell.catalogKind === 'movies') return client.moviePlayUrl(item.id, item.extension)
  if (shell.catalogKind === 'series' && series.key === String(item.id)) return series.url
  return ''
}

/** Portais digitados + os das playlists salvas. */
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

/** Repete a chamada uma vez após trocar de portal. */
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

/** Guarda o primeiro item do catálogo como destaque da home. */
export function featureFirst(kind, catalog) {
  const item = catalog?.categories?.[0]?.items?.[0]
  if (item) state.featured = { kind, name: item.name, id: item.id }
}

/** Carrega o catálogo com rotação de portal. */
export async function fillCatalog() {
  try {
    clearError()
    const catalog = await withRotation(() => catalogFor(state.shell.catalogKind))
    featureFirst(state.shell.catalogKind, catalog)
    state.shell = bindCatalog(state.shell, catalog)
  } catch (error) {
    setError(error.message)
  }
}

/** Entra no modo demo sem rede. */
export function startDemo() {
  state.client = demoClient()
  clearError()
  state.shell = createTvShell()
  state.redraw()
  state.client
    .liveCatalog()
    .then((catalog) => {
      featureFirst('live', catalog)
      state.redraw()
    })
    .catch(() => {})
}

/** Valida, guarda e ativa a playlist do formulário. */
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

/** Testa os portais candidatos e preenche o encontrado. */
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

/** Preenche o formulário com a playlist e o seed. */
export async function hydrateSettingsForm(playlist) {
  if (playlist) {
    byId('plName').value = playlist.name ?? ''
    byId('plPortal').value = playlist.portal ?? ''
    byId('plUser').value = playlist.username ?? ''
    byId('plPass').placeholder = SECRET_PLACEHOLDER
  }
  const seed = await readSeed()
  if (Array.isArray(seed?.candidates)) byId('plCandidates').value = seed.candidates.join('\n')
}

/** Cria a playlist a partir do seed local, se houver senha. */
export async function bootSeed() {
  const seed = await readSeed()
  if (!seed || !seed.username) return false
  const password = await readSecret(SEED_ACCOUNT)
  if (!password) return false
  const playlist = playlistStore.add({
    kind: 'xc',
    name: seed.name ?? DEFAULT_PLAYLIST_NAME,
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

/** Entra na primeira playlist salva com senha disponível. */
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
