import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { parseM3u } from '../src/parseM3u.mjs'
import { faker, fakerM3uItem, fakerM3uPlaylist } from './factories.mjs'

beforeEach(() => {
  faker.seed(45)
})

test('parseia itens EXTINF gerados pelo faker', () => {
  const items = [fakerM3uItem(), fakerM3uItem(), fakerM3uItem()]
  const parsed = parseM3u(fakerM3uPlaylist(items))
  assert.equal(parsed.items.length, 3)
  assert.deepEqual(parsed.items[0], items[0])
  assert.deepEqual(parsed.items[2], items[2])
})

test('rejeita playlist sem EXTINF', () => {
  assert.throws(() => parseM3u('#EXTM3U\n'), /EXTINF/)
})

test('rejeita texto que não é M3U', () => {
  const junk = faker.lorem.paragraph()
  assert.throws(() => parseM3u(junk), /EXTM3U/)
})
