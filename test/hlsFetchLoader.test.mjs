import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { faker, fakerPassword } from './factories.mjs'
import { createHlsFetchLoader } from '../src/hlsFetchLoader.mjs'

beforeEach(() => {
  faker.seed(73)
})

function loadOnce(loader, context) {
  return new Promise((resolve, reject) => {
    loader.load(
      context,
      {},
      {
        onSuccess: (response) => resolve(response),
        onError: (error) => reject(Object.assign(new Error(error.text), error)),
      },
    )
  })
}

test('loader devolve o texto da playlist no onSuccess', async () => {
  const body = '#EXTM3U\n#EXTINF:1,\nseg.ts\n'
  const url = `http://${faker.internet.domainName()}/index.m3u8`
  const fetchFn = async (href) => {
    assert.equal(href, url)
    return {
      ok: true,
      status: 200,
      text: async () => body,
      arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    }
  }
  const loader = new (createHlsFetchLoader(fetchFn))({})
  const response = await loadOnce(loader, { url, responseType: 'text' })
  assert.equal(response.data, body)
  assert.equal(response.url, url)
})

test('loader devolve arrayBuffer quando o hls pede fragmento', async () => {
  const bytes = new Uint8Array([0x47, 0x40, 0x11]).buffer
  const url = `http://${faker.internet.domainName()}/seg.ts`
  const fetchFn = async () => ({
    ok: true,
    status: 200,
    text: async () => '',
    arrayBuffer: async () => bytes,
  })
  const loader = new (createHlsFetchLoader(fetchFn))({})
  const response = await loadOnce(loader, { url, responseType: 'arraybuffer' })
  assert.equal(response.data, bytes)
})

test('loader devolve a URL final depois do redirect', async () => {
  const original = `http://${faker.internet.domainName()}/live/user/pass/1.m3u8`
  const finalUrl = `http://cdn.${faker.internet.domainName()}/play/hls/token/index.m3u8`
  const fetchFn = async () => ({
    ok: true,
    status: 200,
    url: finalUrl,
    text: async () => '#EXTM3U\nseg.ts\n',
    arrayBuffer: async () => new ArrayBuffer(0),
  })
  const loader = new (createHlsFetchLoader(fetchFn))({})
  const response = await loadOnce(loader, { url: original, responseType: 'text' })
  assert.equal(response.url, finalUrl)
})

test('erro http 403 não inclui senha da URL', async () => {
  const password = fakerPassword()
  const url = `http://${faker.internet.domainName()}/live/user/${password}/1.ts`
  const fetchFn = async () => ({
    ok: false,
    status: 403,
    text: async () => 'nope',
    arrayBuffer: async () => new ArrayBuffer(0),
  })
  const loader = new (createHlsFetchLoader(fetchFn))({})
  await assert.rejects(
    () => loadOnce(loader, { url, responseType: 'arraybuffer' }),
    (error) => {
      assert.match(error.text, /403/)
      assert.doesNotMatch(error.text, new RegExp(password))
      return true
    },
  )
})
