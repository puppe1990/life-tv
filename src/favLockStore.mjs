import { snapshotWatchCard } from './watchCard.mjs'

function loadFavs(stored, favs, locks, cards) {
  favs.clear()
  locks.clear()
  cards.clear()
  for (const id of stored?.favs ?? []) favs.add(String(id))
  for (const [id, pin] of Object.entries(stored?.locks ?? {})) locks.set(id, pin)
  for (const [id, card] of Object.entries(stored?.cards ?? {})) cards.set(String(id), card)
}

/** Favorito e lock com pin por stream_id (equivale ao RealmController). */
export function createFavLockStore({ bucket = null } = {}) {
  const favs = new Set()
  const locks = new Map()
  const cards = new Map()
  loadFavs(bucket?.read(), favs, locks, cards)
  function persist() {
    bucket?.write({
      favs: [...favs],
      locks: Object.fromEntries(locks),
      cards: Object.fromEntries(cards),
    })
  }
  return {
    hydrate() {
      loadFavs(bucket?.read(), favs, locks, cards)
    },
    isFav(streamId) {
      return favs.has(String(streamId))
    },
    toggleFav(streamId, card) {
      const key = String(streamId)
      if (favs.has(key)) {
        favs.delete(key)
        cards.delete(key)
      } else {
        favs.add(key)
        if (card) cards.set(key, snapshotWatchCard({ ...card, streamId: key }))
      }
      persist()
    },
    listFavs() {
      return [...favs].reverse().flatMap((id) => {
        const card = cards.get(id)
        return card ? [card] : []
      })
    },
    clear() {
      favs.clear()
      locks.clear()
      cards.clear()
      persist()
    },
    isLocked(streamId) {
      return locks.has(String(streamId))
    },
    lock(streamId, pin) {
      if (typeof pin !== 'string' || pin.trim() === '') {
        throw new Error(`pin recusado: recebido ${JSON.stringify(pin)}, esperado texto`)
      }
      locks.set(String(streamId), pin)
      persist()
    },
    unlock(streamId, pin) {
      const key = String(streamId)
      const expected = locks.get(key)
      if (expected === undefined) return
      if (pin !== expected) {
        throw new Error(`pin recusado: recebido ${pin}, esperado pin do canal`)
      }
      locks.delete(key)
      persist()
    },
  }
}
