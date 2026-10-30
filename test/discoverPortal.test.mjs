import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { discoverPortal } from '../src/discoverPortal.mjs'
import { faker } from './factories.mjs'

beforeEach(() => {
  faker.seed(55)
})

function portalFetch(validPortal, user) {
  return async (url) => {
    if (url.startsWith(validPortal)) {
      return { ok: true, status: 200, json: async () => ({ user_info: user }) }
    }
    return { ok: true, status: 200, json: async () => ({ user_info: { auth: 0 } }) }
  }
}

test('acha o portal que aceita as credenciais', async () => {
  const good = `http://${faker.internet.domainName()}`
  const user = {
    username: faker.internet.username(),
    auth: 1,
    status: 'Active',
    exp_date: '1793371571',
    max_connections: '1',
    active_cons: '0',
  }
  const found = await discoverPortal({
    candidates: ['http://morto.invalid', good],
    username: user.username,
    password: 'x',
    fetch: portalFetch(good, user),
  })
  assert.equal(found.portal, good)
  assert.equal(found.user.username, user.username)
})

test('devolve null quando nenhum portal aceita', async () => {
  const found = await discoverPortal({
    candidates: [`http://${faker.internet.domainName()}`],
    username: 'u',
    password: 'p',
    fetch: async () => ({ ok: true, status: 200, json: async () => ({ user_info: { auth: 0 } }) }),
  })
  assert.equal(found, null)
})

test('ignora candidato inválido e repetido', async () => {
  const portal = `http://${faker.internet.domainName()}`
  let calls = 0
  const found = await discoverPortal({
    candidates: ['', '   ', portal, portal],
    username: 'u',
    password: 'p',
    fetch: async () => {
      calls += 1
      return {
        ok: true,
        status: 200,
        json: async () => ({
          user_info: { username: 'u', auth: 1, status: 'Active', exp_date: '1' },
        }),
      }
    },
  })
  assert.equal(calls, 1)
  assert.equal(found.portal, portal)
})

test('lista vazia é recusada', async () => {
  await assert.rejects(
    () => discoverPortal({ candidates: [], username: 'u', password: 'p', fetch: async () => {} }),
    /portais recusados/,
  )
})
