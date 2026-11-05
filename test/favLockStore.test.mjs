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

test('toggleFav guarda o retrato e listFavs devolve o mais novo na frente', () => {
  const store = createFavLockStore()
  const espn = {
    streamId: String(faker.number.int({ min: 100, max: 999 })),
    name: 'ESPN 1 HD',
    catalogKind: 'live',
  }
  const band = {
    streamId: String(faker.number.int({ min: 1000, max: 9999 })),
    name: 'Band Sports',
    catalogKind: 'live',
  }
  store.toggleFav(espn.streamId, espn)
  store.toggleFav(band.streamId, band)
  const listed = store.listFavs()
  assert.equal(listed.length, 2)
  assert.equal(listed[0].name, 'Band Sports')
  assert.equal(listed[1].name, 'ESPN 1 HD')
})

test('desfavoritar tira o retrato da lista', () => {
  const store = createFavLockStore()
  const card = {
    streamId: String(faker.number.int({ min: 100, max: 999 })),
    name: 'ESPN 1 HD',
    catalogKind: 'live',
  }
  store.toggleFav(card.streamId, card)
  store.toggleFav(card.streamId)
  assert.equal(store.listFavs().length, 0)
  assert.equal(store.isFav(card.streamId), false)
})

test('hidrata retratos do bucket antigo sem cards', () => {
  const storage = createStorage()
  storage.setItem('life-tv:favs', JSON.stringify({ favs: ['521'], locks: {} }))
  const store = createFavLockStore({
    bucket: createJsonBucket({ storage, key: 'life-tv:favs' }),
  })
  assert.equal(store.isFav('521'), true)
  assert.equal(store.listFavs().length, 0)
})

test('hidrata retratos gravados no bucket', () => {
  const storage = createStorage()
  const card = {
    streamId: String(faker.number.int({ min: 100, max: 999 })),
    name: 'Band Sports',
    catalogKind: 'live',
    icon: '',
    url: '',
    extension: '',
  }
  const store = createFavLockStore({
    bucket: createJsonBucket({ storage, key: 'life-tv:favs' }),
  })
  store.toggleFav(card.streamId, card)
  const reaberta = createFavLockStore({
    bucket: createJsonBucket({ storage, key: 'life-tv:favs' }),
  })
  assert.deepEqual(reaberta.listFavs()[0], card)
})

test('clear esvazia favoritos persistidos', () => {
  const storage = createStorage()
  const store = createFavLockStore({
    bucket: createJsonBucket({ storage, key: 'life-tv:favs' }),
  })
  store.toggleFav('521', { streamId: '521', name: 'ESPN 1 HD', catalogKind: 'live' })
  store.clear()
  assert.equal(store.isFav('521'), false)
  assert.equal(store.listFavs().length, 0)
})
