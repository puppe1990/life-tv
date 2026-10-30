import { createTvShell } from '../src/tvShell.mjs'

/** Estado único da tela; views leem, sessão e wiring escrevem. */
export const state = {
  shell: createTvShell(),
  client: null,
  errorText: '',
  series: { key: '', url: '' },
  epg: { key: '', listings: [] },
  redraw: () => {},
}

export function setRedraw(redraw) {
  state.redraw = redraw
}

export function setError(text) {
  state.errorText = text
  state.redraw()
}

export function clearError() {
  state.errorText = ''
}
