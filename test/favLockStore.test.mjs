import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createFavLockStore } from '../src/favLockStore.mjs'
import { createJsonBucket } from '../src/jsonBucket.mjs'
import { faker } from './factories.mjs'

beforeEach(() => {
  faker.seed(48)
})

test('alterna favorito do stream do faker', () => {
  const store = createFavLockStore()
  const streamId = faker.number.int({ min: 1000, max: 99_999 })
  assert.equal(store.isFav(streamId), false)
  store.toggleFav(streamId)
  assert.equal(store.isFav(streamId), true)
  store.toggleFav(streamId)
  assert.equal(store.isFav(streamId), false)
})

test('trava canal com pin do faker e só destrava com o mesmo pin', () => {
  const store = createFavLockStore()
  const streamId = faker.number.int({ min: 1000, max: 99_999 })
  const pin = faker.string.numeric(4)
  store.lock(streamId, pin)
  assert.equal(store.isLocked(streamId), true)
  const wrongPin = pin === '0000' ? '1111' : '0000'
  assert.throws(() => store.unlock(streamId, wrongPin), /pin/)
  store.unlock(streamId, pin)
  assert.equal(store.isLocked(streamId), false)
})

function createStorage() {
  const data = new Map()
  return {
    getItem(key) {
      return data.get(key) ?? null
    },
    setItem(key, value) {
      data.set(key, value)
    },
  }
}

test('hydrate relê favoritos depois do load assíncrono', () => {
  let stored = { favs: [], locks: {} }
  const bucket = {
    read() {
      return stored
    },
    write(value) {
      stored = value
    },
  }
  const store = createFavLockStore({ bucket })
  const streamId = String(faker.number.int({ min: 1000, max: 99_999 }))
  assert.equal(store.isFav(streamId), false)
  stored = { favs: [streamId], locks: { [streamId]: '1234' } }
  store.hydrate()
  assert.equal(store.isFav(streamId), true)
  assert.equal(store.isLocked(streamId), true)
})

test('hidrata favoritos e locks do bucket', () => {
  const storage = createStorage()
  const streamId = faker.number.int({ min: 1000, max: 99_999 })
  const pin = faker.string.numeric(4)
  const store = createFavLockStore({ bucket: createJsonBucket({ storage, key: 'life-tv:favs' }) })
  store.toggleFav(streamId)
  store.lock(streamId, pin)
  const reaberta = createFavLockStore({
    bucket: createJsonBucket({ storage, key: 'life-tv:favs' }),
  })
  assert.equal(reaberta.isFav(streamId), true)
  assert.equal(reaberta.isLocked(streamId), true)
})
