/** Primeira leva de cards; o resto entra no scroll. */
export const CHANNEL_CARD_PAGE = 48

/** Alterna a listagem de canais entre faixa e grade. */
export function nextChannelLayout(current) {
  return current === 'card' ? 'list' : 'card'
}

/** Rótulo do botão: o modo para o qual o clique vai. */
export function channelLayoutLabel(layout) {
  return layout === 'card' ? 'Lista' : 'Cards'
}

/** Cards paginam; lista pinta a categoria inteira. */
export function itemsToPaint(items, layout, limit = CHANNEL_CARD_PAGE) {
  const list = items ?? []
  if (layout !== 'card') return list
  const cap = Number.isFinite(limit) ? Math.max(0, limit) : CHANNEL_CARD_PAGE
  return list.slice(0, cap)
}

/** Soma uma página sem passar do total. */
export function growCardLimit(limit, total, page = CHANNEL_CARD_PAGE) {
  const now = Number.isFinite(limit) ? limit : page
  const max = Math.max(0, Number(total) || 0)
  return Math.min(max, now + page)
}
