import { CHANNEL_CARD_PAGE } from '../src/channelLayout.mjs'
import { createTvShell } from '../src/tvShell.mjs'

/** Estado único da tela; views leem, sessão e wiring escrevem. */
export const state = {
  shell: createTvShell(),
  client: null,
  errorText: '',
  series: { key: '', url: '' },
  featured: null,
  playlistId: '',
  epg: { key: '', listings: [] },
  channelLayout: 'list',
  itemLimit: CHANNEL_CARD_PAGE,
  redraw: () => {},
}

/** Registra a função de redesenho (renderAll). */
export function setRedraw(redraw) {
  state.redraw = redraw
}

/** Publica a mensagem de erro e redesenha. */
export function setError(text) {
  state.errorText = text
  state.redraw()
}

/** Limpa a mensagem de erro sem redesenhar. */
export function clearError() {
  state.errorText = ''
}
