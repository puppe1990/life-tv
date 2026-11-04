import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createSqliteBucket, migrateLocalToSqlite } from '../src/sqliteBucket.mjs'
import { faker } from './factories.mjs'

beforeEach(() => {
  faker.seed(81)
})

function createMemoryInvoke() {
  const kv = new Map()
  async function invoke(cmd, args = {}) {
    if (cmd === 'db_get') return kv.has(args.key) ? kv.get(args.key) : null
    if (cmd === 'db_set') {
      kv.set(args.key, args.value)
      return
    }
    throw new Error(`comando recusado: recebido ${cmd}, esperado db_get ou db_set`)
  }
  invoke.kv = kv
  return invoke
}

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

test('grava e lê de volta o JSON via db_get/db_set', async () => {
  const invoke = createMemoryInvoke()
  const key = 'life-tv:playlists'
  const value = { name: faker.company.name(), url: faker.internet.url() }
  const writer = createSqliteBucket({ invoke, key })
  await writer.write(value)
  const reader = createSqliteBucket({ invoke, key })
  assert.equal(reader.read(), null)
  assert.deepEqual(await reader.load(), value)
  assert.deepEqual(reader.read(), value)
})

test('rejeita chave fora do padrão', () => {
  const invoke = createMemoryInvoke()
  assert.throws(() => createSqliteBucket({ invoke, key: 'chave inválida' }), /bucket recusado/)
})

test('load de JSON corrompido vira null', async () => {
  const invoke = createMemoryInvoke()
  invoke.kv.set('life-tv:favs', '{nao-json')
  const bucket = createSqliteBucket({ invoke, key: 'life-tv:favs' })
  assert.equal(await bucket.load(), null)
})

test('write atualiza a memória mesmo quando o invoke falha', async () => {
  const invoke = async () => {
    throw new Error('sem disco')
  }
  const bucket = createSqliteBucket({ invoke, key: 'life-tv:quota' })
  await bucket.write({ ok: true })
  assert.deepEqual(bucket.read(), { ok: true })
})

test('grava o último valor quando dois writes se sobrepõem', async () => {
  const kv = new Map()
  let releaseFirst
  const firstGate = new Promise((resolve) => {
    releaseFirst = resolve
  })
  let sets = 0
  const invoke = async (cmd, args = {}) => {
    if (cmd === 'db_get') return kv.has(args.key) ? kv.get(args.key) : null
    if (cmd === 'db_set') {
      sets += 1
      if (sets === 1) await firstGate
      kv.set(args.key, args.value)
    }
  }
  const bucket = createSqliteBucket({ invoke, key: 'life-tv:playlists' })
  const firstWrite = bucket.write([{ id: 'pl-1' }])
  const secondWrite = bucket.write([{ id: 'pl-1' }, { id: 'pl-2' }])
  releaseFirst()
  await Promise.all([firstWrite, secondWrite])
  assert.equal(kv.get('life-tv:playlists'), JSON.stringify([{ id: 'pl-1' }, { id: 'pl-2' }]))
})

test('migrate copia o localStorage só quando o sqlite está vazio', async () => {
  const invoke = createMemoryInvoke()
  const storage = createMemoryStorage()
  const playlists = [{ id: 'pl-1', kind: 'm3u', name: faker.company.name() }]
  const favs = { favs: [String(faker.number.int({ min: 10, max: 99 }))], locks: {} }
  storage.setItem('life-tv:playlists', JSON.stringify(playlists))
  storage.setItem('life-tv:favs', JSON.stringify(favs))
  invoke.kv.set('life-tv:favs', JSON.stringify({ favs: ['kept'], locks: {} }))
  await migrateLocalToSqlite({
    invoke,
    storage,
    keys: ['life-tv:playlists', 'life-tv:favs', 'life-tv:resume'],
  })
  assert.equal(invoke.kv.get('life-tv:playlists'), JSON.stringify(playlists))
  assert.equal(invoke.kv.get('life-tv:favs'), JSON.stringify({ favs: ['kept'], locks: {} }))
  assert.equal(invoke.kv.has('life-tv:resume'), false)
})
