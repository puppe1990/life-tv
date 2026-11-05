const KINDS = new Set(['live', 'movies', 'series'])

function textOf(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

/** Retrato persistível de um item do catálogo. */
export function watchCardFromItem(item, catalogKind) {
  return {
    streamId: textOf(item?.streamId || item?.id),
    name: textOf(item?.name),
    catalogKind,
    icon: textOf(item?.icon),
    url: textOf(item?.url),
    extension: textOf(item?.extension),
  }
}

/** Item mínimo pra abrir o player a partir do retrato. */
export function itemFromWatchCard(card) {
  return {
    id: card.streamId,
    name: card.name,
    icon: card.icon || undefined,
    url: card.url || undefined,
    extension: card.extension || undefined,
  }
}

/** Valida o retrato antes de gravar no histórico ou nos favoritos. */
export function snapshotWatchCard(entry) {
  const card = watchCardFromItem(entry, entry?.catalogKind)
  if (!card.streamId) {
    throw new Error(
      `histórico recusado: recebido streamId ${JSON.stringify(entry?.streamId ?? entry?.id)}, esperado texto não vazio`,
    )
  }
  if (!card.name) {
    throw new Error(
      `histórico recusado: recebido name ${JSON.stringify(entry?.name)}, esperado texto não vazio`,
    )
  }
  if (!KINDS.has(card.catalogKind)) {
    throw new Error(
      `histórico recusado: recebido catalogKind ${JSON.stringify(card.catalogKind)}, esperado live, movies ou series`,
    )
  }
  return card
}
