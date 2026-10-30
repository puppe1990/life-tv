import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { redactPlaylist, restorePlaylist } from '../src/playlistSecret.mjs'
import { faker } from './factories.mjs'

beforeEach(() => {
  faker.seed(54)
})

function samplePlaylist() {
  const portal = `http://${faker.internet.domainName()}:8080`
  const username = faker.internet.username()
  const password = faker.internet.password()
  return {
    id: 'pl-1',
    kind: 'xc',
    name: 'Casa',
    portal,
    username,
    password,
    getPhpUrl: `http://x/get.php?username=${username}&password=${password}`,
  }
}

test('redige senha e get.php antes de gravar', () => {
  const redacted = redactPlaylist(samplePlaylist())
  assert.equal(redacted.password, undefined)
  assert.equal(redacted.getPhpUrl, undefined)
  assert.equal(redacted.username !== undefined, true)
})

test('restaura senha e remonta o get.php', () => {
  const redacted = redactPlaylist(samplePlaylist())
  const restored = restorePlaylist(redacted, 'segredo')
  assert.equal(restored.password, 'segredo')
  assert.match(restored.getPhpUrl, /password=segredo/)
})

test('restore recusa senha ausente', () => {
  assert.throws(() => restorePlaylist(redactPlaylist(samplePlaylist()), ''), /senha recusada/)
})

test('playlist m3u passa intacta', () => {
  const m3u = { kind: 'm3u', name: 'Lista', url: 'http://x/list.m3u' }
  assert.deepEqual(redactPlaylist(m3u), m3u)
  assert.deepEqual(restorePlaylist(m3u, 'x'), m3u)
})
