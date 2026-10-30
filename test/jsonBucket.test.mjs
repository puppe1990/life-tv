import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createJsonBucket } from '../src/jsonBucket.mjs'
import { faker } from './factories.mjs'

function createMemoryStorage() {
  const entries = new Map()
  return {
    getItem(key) {
      return entries.has(key) ? entries.get(key) : null
    },
    setItem(key, value) {
      entries.set(key, value)
    },
  }
}

beforeEach(() => {
  faker.seed(49)
})

test('lê de volta o valor gravado no storage', () => {
  const storage = createMemoryStorage()
  const bucket = createJsonBucket({ storage, key: 'life-tv:teste' })
  const value = { streamId: faker.number.int({ min: 10, max: 999 }) }
  bucket.write(value)
  assert.deepEqual(createJsonBucket({ storage, key: 'life-tv:teste' }).read(), value)
})

test('rejeita chave fora do padrão', () => {
  assert.throws(() => createJsonBucket({ key: 'chave inválida' }), /bucket recusado/)
})

test('funciona em memória quando o storage lança', () => {
  const storage = {
    getItem() {
      throw new Error('sem acesso')
    },
    setItem() {
      throw new Error('sem espaço')
    },
  }
  const bucket = createJsonBucket({ storage, key: 'life-tv:quota' })
  bucket.write({ ok: true })
  assert.deepEqual(bucket.read(), { ok: true })
})

test('sem storage guarda em memória', () => {
  const bucket = createJsonBucket({ key: 'life-tv:memoria' })
  bucket.write({ n: 1 })
  assert.deepEqual(bucket.read(), { n: 1 })
})
