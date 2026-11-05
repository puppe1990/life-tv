import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { pickBootPlaylist } from '../src/bootPlaylist.mjs'
import { createFakeXtreamPortal } from '../src/fakeXtreamPortal.mjs'
import {
  faker,
  fakerM3uPlaylist,
  fakerPassword,
  fakerPlaylistName,
  fakerPortal,
  fakerUsername,
  fakerXtreamLogin,
} from './factories.mjs'

beforeEach(() => {
  faker.seed(73)
})

function xcPlaylist() {
  const portal = fakerPortal({ protocol: 'http', port: 8080 })
  const username = fakerUsername()
  const password = fakerPassword()
  return {
    playlist: {
      kind: 'xc',
      id: 'pl-1',
      name: fakerPlaylistName(),
      portal,
      username,
      password,
    },
    portal,
    username,
    password,
  }
}

test('prefere XC que o portal aceita mesmo com M3U na lista', async () => {
  const xc = xcPlaylist()
  const m3u = {
    kind: 'm3u',
    id: 'pl-2',
    name: fakerPlaylistName(),
    url: `${fakerPortal({ protocol: 'https', port: 443 })}/list.m3u`,
    content: fakerM3uPlaylist(),
  }
  const login = fakerXtreamLogin({
    username: xc.username,
    password: xc.password,
    portal: xc.portal,
  })
  const picked = await pickBootPlaylist([m3u, xc.playlist], {
    fetch: createFakeXtreamPortal({
      username: xc.username,
      password: xc.password,
      login,
    }),
  })
  assert.equal(picked.kind, 'xc')
  assert.equal(picked.playlist.id, xc.playlist.id)
})

test('cai na M3U quando o XC do painel recusa', async () => {
  const xc = xcPlaylist()
  const m3u = {
    kind: 'm3u',
    id: 'pl-2',
    name: fakerPlaylistName(),
    url: `${fakerPortal({ protocol: 'https', port: 443 })}/list.m3u`,
    content: fakerM3uPlaylist(),
  }
  const picked = await pickBootPlaylist([xc.playlist, m3u], {
    fetch: async () => new Response('nope', { status: 500 }),
  })
  assert.equal(picked.kind, 'm3u')
  assert.equal(picked.playlist.id, m3u.id)
})

test('ignora XC que o painel recusa com user_not_found', async () => {
  const xc = xcPlaylist()
  const picked = await pickBootPlaylist([xc.playlist], {
    fetch: async () =>
      new Response(JSON.stringify({ error: 'user_not_found' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      }),
  })
  assert.equal(picked.kind, null)
  assert.match(picked.error.message, /user_not_found/)
})

test('aceita XC cujo ping passa no portal fake', async () => {
  const xc = xcPlaylist()
  const login = fakerXtreamLogin({
    username: xc.username,
    password: xc.password,
    portal: xc.portal,
  })
  const picked = await pickBootPlaylist([xc.playlist], {
    fetch: createFakeXtreamPortal({
      username: xc.username,
      password: xc.password,
      login,
    }),
  })
  assert.equal(picked.kind, 'xc')
  assert.equal(picked.playlist.username, xc.username)
  const session = await picked.client.login()
  assert.equal(session.status, 'Active')
})
