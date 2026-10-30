/** Favorito e lock com pin por stream_id (equivale ao RealmController). */
export function createFavLockStore() {
  const favs = new Set()
  const locks = new Map()
  return {
    isFav(streamId) {
      return favs.has(streamId)
    },
    toggleFav(streamId) {
      if (favs.has(streamId)) favs.delete(streamId)
      else favs.add(streamId)
    },
    isLocked(streamId) {
      return locks.has(streamId)
    },
    lock(streamId, pin) {
      if (typeof pin !== 'string' || pin.trim() === '') {
        throw new Error(`pin recusado: recebido ${JSON.stringify(pin)}, esperado texto`)
      }
      locks.set(streamId, pin)
    },
    unlock(streamId, pin) {
      const expected = locks.get(streamId)
      if (expected === undefined) return
      if (pin !== expected) {
        throw new Error(`pin recusado: recebido ${pin}, esperado pin do canal`)
      }
      locks.delete(streamId)
    },
  }
}
