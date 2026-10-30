import { renderCatalog, renderHome, renderTabs } from './catalogView.mjs'
import { byId } from './dom.mjs'
import { renderPlayer } from './playerView.mjs'
import { state } from './state.mjs'

function renderSettings() {
  byId('settings').hidden = state.shell.screen !== 'settings'
}

/** Redesenha todas as seções visíveis a partir do estado. */
export function renderAll() {
  renderHome()
  renderCatalog()
  renderPlayer()
  renderSettings()
  renderTabs()
  byId('error').textContent = state.errorText
}
