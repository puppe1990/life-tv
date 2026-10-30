/** Favorito e lock com pin por stream_id (equivale ao RealmController). */
export function createFavLockStore({ bucket = null } = {}) {
  const stored = bucket?.read() ?? {}
  const favs = new Set(stored.favs ?? [])
  const locks = new Map(Object.entries(stored.locks ?? {}))
  function persist() {
    bucket?.write({ favs: [...favs], locks: Object.fromEntries(locks) })
  }
  return {
    isFav(streamId) {
      return favs.has(String(streamId))
    },
    toggleFav(streamId) {
      const key = String(streamId)
      if (favs.has(key)) favs.delete(key)
      else favs.add(key)
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
