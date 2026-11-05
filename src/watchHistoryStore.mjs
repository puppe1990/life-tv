import { snapshotWatchCard } from './watchCard.mjs'

const DEFAULT_LIMIT = 20

function loadItems(stored) {
  if (!Array.isArray(stored)) return []
  return stored.filter((item) => item && typeof item === 'object' && item.streamId && item.name)
}

/** Histórico do que foi assistido, mais recente na frente. */
export function createWatchHistoryStore({
  bucket = null,
  now = Date.now,
  limit = DEFAULT_LIMIT,
} = {}) {
  let items = loadItems(bucket?.read())

  function persist() {
    bucket?.write(items)
  }

  return {
    hydrate() {
      items = loadItems(bucket?.read())
    },
    remember(entry) {
      const card = snapshotWatchCard(entry)
      card.watchedAt = now()
      items = [card, ...items.filter((item) => item.streamId !== card.streamId)].slice(0, limit)
      persist()
    },
    list() {
      return [...items]
    },
    clear() {
      items = []
      persist()
    },
  }
}
