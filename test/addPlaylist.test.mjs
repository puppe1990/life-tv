import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createPlaylistStore } from '../src/addPlaylist.mjs'
import { createJsonBucket } from '../src/jsonBucket.mjs'
import { xcGetPhpUrl } from '../src/xtreamUrls.mjs'
import {
  faker,
  fakerPassword,
  fakerPlaylistName,
  fakerPortal,
  fakerUsername,
} from './factories.mjs'

beforeEach(() => {
  faker.seed(43)
})

test('grava playlist XC local sem MAC e com get.php concatenado', () => {
  const store = createPlaylistStore()
  const name = fakerPlaylistName()
  const portal = fakerPortal({ protocol: 'http', port: 8080 })
  const username = fakerUsername()
  const password = fakerPassword()
  const playlist = store.add({
    kind: 'xc',
    name,
    portal: `${portal}/`,
    username,
    password,
    mac: faker.string.hexadecimal({ length: 12, prefix: '' }),
  })
  assert.equal(playlist.kind, 'xc')
  assert.equal(playlist.name, name)
  assert.equal(playlist.portal, portal)
  assert.equal(playlist.username, username)
  assert.equal(playlist.password, password)
  assert.equal(playlist.getPhpUrl, xcGetPhpUrl({ portal, username, password }))
  assert.equal(playlist.mac, undefined)
  assert.deepEqual(Object.keys(playlist).includes('mac'), false)
  assert.equal(store.list().length, 1)
})

test('grava playlist M3U pela URL do faker', () => {
  const store = createPlaylistStore()
  const name = fakerPlaylistName()
  const url = `${fakerPortal({ protocol: 'https', port: 443 })}/list.m3u`
  const playlist = store.add({ kind: 'm3u', name, url })
  assert.equal(playlist.kind, 'm3u')
  assert.equal(playlist.name, name)
  assert.equal(playlist.url, url)
  assert.equal(playlist.username, undefined)
})

test('rejeita XC sem senha', () => {
  const store = createPlaylistStore()
  assert.throws(
    () =>
      store.add({
        kind: 'xc',
        name: fakerPlaylistName(),
        portal: fakerPortal(),
        username: fakerUsername(),
      }),
    /password/,
  )
})

test('rejeita M3U sem url nem content', () => {
  const store = createPlaylistStore()
  assert.throws(() => store.add({ kind: 'm3u', name: fakerPlaylistName() }), /url ou content/)
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

test('reabre a store com a playlist XC gravada', () => {
  const storage = createStorage()
  const portal = `http://${faker.internet.domainName()}:8080`
  const username = faker.internet.username()
  const password = faker.internet.password()
  const saved = createPlaylistStore({
    bucket: createJsonBucket({ storage, key: 'life-tv:playlists' }),
  }).add({ kind: 'xc', name: 'Casa', portal, username, password })
  const reaberta = createPlaylistStore({
    bucket: createJsonBucket({ storage, key: 'life-tv:playlists' }),
  })
  assert.equal(reaberta.list().length, 1)
  assert.deepEqual(reaberta.list()[0], saved)
  assert.equal(reaberta.add({ kind: 'xc', name: 'B', portal, username, password }).id, 'pl-2')
})
