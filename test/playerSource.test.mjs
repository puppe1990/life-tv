import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { resolvePlayerSource } from '../src/playerSource.mjs'
import { faker } from './factories.mjs'

const HLS_TYPE = 'application/vnd.apple.mpegurl'

beforeEach(() => {
  faker.seed(50)
})

test('HLS toca quando o webview declara suporte', () => {
  const url = `http://${faker.internet.domainName()}/live/user/pass/1.m3u8`
  const source = resolvePlayerSource(url, { canPlay: (type) => (type === HLS_TYPE ? 'maybe' : '') })
  assert.deepEqual(source, { kind: 'hls', url })
})

test('HLS sem suporte vira unsupported', () => {
  const url = `http://${faker.internet.domainName()}/live/user/pass/2.m3u8`
  const source = resolvePlayerSource(url, { canPlay: () => '' })
  assert.equal(source.kind, 'unsupported')
  assert.match(source.reason, /HLS/)
})

test('mp4 e webm tocam progressivo, ignorando a query', () => {
  const host = faker.internet.domainName()
  assert.equal(resolvePlayerSource(`http://${host}/movie/1.mp4?token=x`).kind, 'progressive')
  assert.equal(resolvePlayerSource(`http://${host}/movie/2.WEBM`).kind, 'progressive')
})

test('MPEG-TS do Xtream depende do mpv sidecar', () => {
  const url = `http://${faker.internet.domainName()}/live/user/pass/289465.ts`
  const source = resolvePlayerSource(url)
  assert.equal(source.kind, 'sidecar')
  assert.match(source.reason, /mpv/)
})

test('url vazia é recusada com o valor recebido', () => {
  assert.throws(() => resolvePlayerSource(''), /url recusada/)
})
