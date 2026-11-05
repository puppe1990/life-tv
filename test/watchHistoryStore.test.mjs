import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createJsonBucket } from '../src/jsonBucket.mjs'
import { createWatchHistoryStore } from '../src/watchHistoryStore.mjs'
import { faker } from './factories.mjs'

beforeEach(() => {
  faker.seed(91)
})

function liveCard(overrides = {}) {
  return {
    streamId: String(faker.number.int({ min: 1000, max: 99_999 })),
    name: faker.company.name(),
    catalogKind: 'live',
    icon: '',
    ...overrides,
  }
}

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

test('remember coloca o canal na frente da lista', () => {
  let now = 1_700_000_000_000
  const store = createWatchHistoryStore({ now: () => now })
  const first = liveCard({ name: 'ESPN 1 HD' })
  const second = liveCard({ name: 'A Fazenda 18' })
  store.remember(first)
  now += 1000
  store.remember(second)
  const listed = store.list()
  assert.equal(listed.length, 2)
  assert.equal(listed[0].name, 'A Fazenda 18')
  assert.equal(listed[0].watchedAt, 1_700_000_001_000)
  assert.equal(listed[1].name, 'ESPN 1 HD')
})

test('mesmo streamId sobe para a frente sem duplicar', () => {
  const store = createWatchHistoryStore({ now: () => 10 })
  const first = liveCard({ streamId: '521', name: 'ESPN 1 HD' })
  store.remember(first)
  store.remember(liveCard({ name: 'Outro' }))
  store.remember({ ...first, name: 'ESPN 1 HD' })
  const listed = store.list()
  assert.equal(listed.length, 2)
  assert.equal(listed[0].streamId, '521')
  assert.equal(listed[1].name, 'Outro')
})

test('corta a lista no limite de 20', () => {
  const store = createWatchHistoryStore({ now: () => 1, limit: 20 })
  for (let index = 0; index < 21; index += 1) {
    store.remember(liveCard({ streamId: String(index), name: `Canal ${index}` }))
  }
  const listed = store.list()
  assert.equal(listed.length, 20)
  assert.equal(listed[0].streamId, '20')
  assert.equal(
    listed.some((item) => item.streamId === '0'),
    false,
  )
})

test('recusa streamId vazio', () => {
  const store = createWatchHistoryStore()
  assert.throws(() => store.remember(liveCard({ streamId: '' })), /streamId/)
})

test('recusa catalogKind fora de live, movies ou series', () => {
  const store = createWatchHistoryStore()
  assert.throws(() => store.remember(liveCard({ catalogKind: 'radio' })), /catalogKind/)
})

test('recusa nome vazio', () => {
  const store = createWatchHistoryStore()
  assert.throws(() => store.remember(liveCard({ name: '   ' })), /name/)
})

test('hydrate relê a lista depois do load assíncrono', () => {
  let stored = []
  const bucket = {
    read() {
      return stored
    },
    write(value) {
      stored = value
    },
  }
  const store = createWatchHistoryStore({ bucket, now: () => 5 })
  assert.equal(store.list().length, 0)
  stored = [{ streamId: '521', name: 'ESPN 1 HD', catalogKind: 'live', watchedAt: 5 }]
  store.hydrate()
  assert.equal(store.list()[0].name, 'ESPN 1 HD')
})

test('hidrata a store reaberta a partir do bucket', () => {
  const storage = createStorage()
  const card = liveCard({ name: 'Band Sports' })
  createWatchHistoryStore({
    bucket: createJsonBucket({ storage, key: 'life-tv:history' }),
    now: () => 9,
  }).remember(card)
  const reaberta = createWatchHistoryStore({
    bucket: createJsonBucket({ storage, key: 'life-tv:history' }),
  })
  assert.equal(reaberta.list()[0].name, 'Band Sports')
  assert.equal(reaberta.list()[0].streamId, card.streamId)
})

test('clear esvazia a lista persistida', () => {
  const storage = createStorage()
  const store = createWatchHistoryStore({
    bucket: createJsonBucket({ storage, key: 'life-tv:history' }),
  })
  store.remember(liveCard())
  store.clear()
  assert.equal(store.list().length, 0)
  assert.equal(
    createWatchHistoryStore({
      bucket: createJsonBucket({ storage, key: 'life-tv:history' }),
    }).list().length,
    0,
  )
})
