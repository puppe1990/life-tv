import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { parseXtreamLogin } from '../src/parseXtreamLogin.mjs'
import { faker, fakerXtreamLogin } from './factories.mjs'

beforeEach(() => {
  faker.seed(41)
})

test('aceita login Active com auth 1 gerado pelo faker', () => {
  const payload = fakerXtreamLogin({ auth: 1, status: 'Active' })
  const login = parseXtreamLogin(payload)
  assert.equal(login.username, payload.user_info.username)
  assert.equal(login.status, 'Active')
  assert.equal(login.maxConnections, Number(payload.user_info.max_connections))
  assert.equal(login.activeCons, Number(payload.user_info.active_cons))
  assert.equal(login.expDate, Number(payload.user_info.exp_date))
  assert.equal(login.server.host, payload.server_info.url)
  assert.equal(login.server.protocol, payload.server_info.server_protocol)
  assert.equal(login.server.port, Number(payload.server_info.port))
})

test('aceita auth string "1"', () => {
  const payload = fakerXtreamLogin({ auth: '1', status: 'Active' })
  const login = parseXtreamLogin(payload)
  assert.equal(login.username, payload.user_info.username)
})

test('rejeita auth 0 com o valor recebido', () => {
  const payload = fakerXtreamLogin({ auth: 0, status: 'Active' })
  assert.throws(() => parseXtreamLogin(payload), /auth 0/)
})

test('rejeita status Expired com o valor recebido', () => {
  const payload = fakerXtreamLogin({ auth: 1, status: 'Expired' })
  assert.throws(() => parseXtreamLogin(payload), /status Expired/)
})

test('rejeita payload sem user_info', () => {
  assert.throws(() => parseXtreamLogin({ server_info: {} }), /user_info/)
})
