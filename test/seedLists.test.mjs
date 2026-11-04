import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { seedM3uPlaylists, settingsFormValues } from '../src/seedLists.mjs'
import { faker, fakerPlaylistName, fakerPortal } from './factories.mjs'

beforeEach(() => {
  faker.seed(77)
})

test('seedM3uPlaylists lê name e url e ignora linha vazia', () => {
  const url = `${fakerPortal({ protocol: 'https', port: 443 })}/br.m3u`
  const name = fakerPlaylistName()
  const lists = seedM3uPlaylists({
    m3u: [{ name, url }, { name: '  ', url: 'https://x.test/a.m3u' }, { name: 'X' }],
  })
  assert.equal(lists.length, 1)
  assert.equal(lists[0].kind, 'm3u')
  assert.equal(lists[0].name, name)
  assert.equal(lists[0].url, url)
})

test('settingsFormValues mantém portal e usuário do seed com playlist M3U', () => {
  const seed = {
    name: fakerPlaylistName(),
    portal: fakerPortal({ protocol: 'http', port: 80 }),
    username: 'casa',
    candidates: [fakerPortal({ protocol: 'http', port: 80 })],
  }
  const playlist = {
    kind: 'm3u',
    name: fakerPlaylistName(),
    url: `${fakerPortal({ protocol: 'https', port: 443 })}/sports.m3u`,
  }
  const values = settingsFormValues({ playlist, seed })
  assert.equal(values.portal, seed.portal)
  assert.equal(values.username, seed.username)
  assert.equal(values.m3u, playlist.url)
  assert.equal(values.name, playlist.name)
  assert.equal(values.candidates, seed.candidates.join('\n'))
})

test('settingsFormValues preenche o seed mesmo sem playlist ativa', () => {
  const seed = {
    name: 'Casa',
    portal: fakerPortal({ protocol: 'http', port: 8080 }),
    username: 'casa',
    candidates: ['http://a.test', 'http://b.test'],
    m3u: [{ name: 'Brasil', url: 'https://iptv.example/br.m3u' }],
  }
  const values = settingsFormValues({ playlist: null, seed })
  assert.equal(values.name, 'Casa')
  assert.equal(values.portal, seed.portal)
  assert.equal(values.username, 'casa')
  assert.equal(values.m3u, 'https://iptv.example/br.m3u')
  assert.equal(values.candidates, 'http://a.test\nhttp://b.test')
})
