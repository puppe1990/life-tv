import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { describeXtreamRefusal } from '../src/xtreamRefusal.mjs'
import { faker, fakerPassword, fakerPortal, fakerUsername } from './factories.mjs'

beforeEach(() => {
  faker.seed(71)
})

test('403 JSON inclui o erro do painel e o host, sem a senha', () => {
  const portal = fakerPortal({ protocol: 'http', port: 80 })
  const username = fakerUsername()
  const password = fakerPassword()
  const url = `${portal}/player_api.php?username=${username}&password=${password}&action=get_live_streams`
  const message = describeXtreamRefusal({
    status: 403,
    raw: JSON.stringify({ error: 'user_not_found' }),
    url,
  })
  assert.match(message, /HTTP 403/)
  assert.match(message, /user_not_found/)
  assert.equal(message.includes(new URL(portal).host), true)
  assert.equal(message.includes(password), false)
  assert.match(message, /esperado 200/)
})

test('404 HTML descreve a página e o portal', () => {
  const portal = fakerPortal({ protocol: 'http', port: 8080 })
  const message = describeXtreamRefusal({
    status: 404,
    raw: '<html><head><title>404 Not Found</title></head></html>',
    url: `${portal}/player_api.php?username=u&password=segredo`,
  })
  assert.match(message, /HTTP 404/)
  assert.match(message, /HTML/)
  assert.equal(message.includes(new URL(portal).host), true)
  assert.equal(message.includes('segredo'), false)
})
