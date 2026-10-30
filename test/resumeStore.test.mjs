import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createJsonBucket } from '../src/jsonBucket.mjs'
import { createResumeStore } from '../src/resumeStore.mjs'
import { faker } from './factories.mjs'

beforeEach(() => {
  faker.seed(47)
})

test('grava posição do faker quando está no meio do título', () => {
  const store = createResumeStore()
  const streamId = faker.number.int({ min: 1000, max: 99_999 })
  const durationMs = faker.number.int({ min: 40 * 60_000, max: 150 * 60_000 })
  const positionMs = faker.number.int({ min: 15_000, max: Math.floor(durationMs * 0.5) })
  store.save({ streamId, positionMs, durationMs })
  assert.deepEqual(store.load(streamId), { streamId, positionMs, durationMs })
})

test('ignora posição abaixo de 10s', () => {
  const store = createResumeStore()
  const streamId = faker.number.int({ min: 1000, max: 99_999 })
  store.save({
    streamId,
    positionMs: faker.number.int({ min: 0, max: 9_999 }),
    durationMs: 90 * 60_000,
  })
  assert.equal(store.load(streamId), null)
})

test('apaga resume quando passa de 90% da duração', () => {
  const store = createResumeStore()
  const streamId = faker.number.int({ min: 1000, max: 99_999 })
  const durationMs = 100 * 60_000
  store.save({ streamId, positionMs: 20_000, durationMs })
  store.save({ streamId, positionMs: 91 * 60_000, durationMs })
  assert.equal(store.load(streamId), null)
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

test('hidrata a store reaberta a partir do bucket', () => {
  const storage = createStorage()
  const streamId = faker.number.int({ min: 1000, max: 99_999 })
  const positionMs = 120_000
  const durationMs = 90 * 60_000
  createResumeStore({ bucket: createJsonBucket({ storage, key: 'life-tv:resume' }) }).save({
    streamId,
    positionMs,
    durationMs,
  })
  const reaberta = createResumeStore({
    bucket: createJsonBucket({ storage, key: 'life-tv:resume' }),
  })
  assert.deepEqual(reaberta.load(streamId), { streamId, positionMs, durationMs })
})
