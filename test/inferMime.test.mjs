import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { inferAdaptiveMime } from '../src/inferMime.mjs'
import { faker, fakerPortal } from './factories.mjs'

beforeEach(() => {
  faker.seed(46)
})

test('infere HLS a partir de .m3u8 do faker', () => {
  const url = `${fakerPortal()}/live/${faker.string.alphanumeric(8)}.m3u8`
  assert.equal(inferAdaptiveMime(url), 'application/x-mpegURL')
})

test('infere DASH a partir de .mpd com query do faker', () => {
  const url = `${fakerPortal()}/play.mpd?token=${faker.string.alphanumeric(8)}`
  assert.equal(inferAdaptiveMime(url), 'application/dash+xml')
})

test('infere MPEG-TS, MP4 e Matroska pela extensão', () => {
  const host = fakerPortal()
  assert.equal(inferAdaptiveMime(`${host}/ch.ts`), 'video/MP2T')
  assert.equal(inferAdaptiveMime(`${host}/film.mp4`), 'video/mp4')
  assert.equal(inferAdaptiveMime(`${host}/film.mkv`), 'video/x-matroska')
})

test('devolve null quando a extensão é desconhecida', () => {
  const url = `${fakerPortal()}/${faker.system.fileName({ extensionCount: 0 })}.bin`
  assert.equal(inferAdaptiveMime(url), null)
})
