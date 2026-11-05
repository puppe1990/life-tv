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

function okFetch(body = '#EXTM3U\n#EXTINF:10,\nseg.ts\n') {
  return async () => ({
    ok: true,
    status: 200,
    url: `http://${faker.internet.domainName()}/index.m3u8`,
    text: async () => body,
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
  })
}

test('onSuccess inclui code HTTP e reusa o stats do construtor', async () => {
  const url = `http://${faker.internet.domainName()}/index.m3u8`
  const loader = new (createHlsFetchLoader(okFetch()))({})
  const statsBefore = loader.stats
  const seen = await new Promise((resolve, reject) => {
    loader.load(
      { url, responseType: 'text' },
      {},
      {
        onSuccess: (response, stats) => resolve({ response, stats }),
        onError: (error) => reject(new Error(error.text)),
      },
    )
  })
  assert.equal(seen.response.code, 200)
  assert.equal(seen.stats, statsBefore)
  assert.equal(loader.stats, statsBefore)
})

test('loading.start usa a escala de performance.now', async () => {
  const url = `http://${faker.internet.domainName()}/index.m3u8`
  const loader = new (createHlsFetchLoader(okFetch()))({})
  await loadOnce(loader, { url, responseType: 'text' })
  const start = loader.stats.loading.start
  assert.equal(typeof start, 'number')
  assert.ok(start > 0, `start ${start} deveria ser > 0`)
  assert.ok(start < 1e10, `start ${start} deveria ser performance.now(), não Date.now()`)
  assert.ok(loader.stats.loading.end >= loader.stats.loading.first)
})

test('abort marca stats e não chama onSuccess', async () => {
  const url = `http://${faker.internet.domainName()}/index.m3u8`
  let finish
  const fetchFn = () =>
    new Promise((resolve) => {
      finish = resolve
    })
  const loader = new (createHlsFetchLoader(fetchFn))({})
  const hits = { success: 0, abort: 0 }
  loader.load(
    { url, responseType: 'text' },
    {},
    {
      onSuccess: () => {
        hits.success += 1
      },
      onError: () => {},
      onAbort: () => {
        hits.abort += 1
      },
    },
  )
  loader.abort()
  finish({
    ok: true,
    status: 200,
    text: async () => '#EXTM3U\n',
    arrayBuffer: async () => new ArrayBuffer(0),
  })
  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(hits.success, 0)
  assert.equal(loader.stats.aborted, true)
})
