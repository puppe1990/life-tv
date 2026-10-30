import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { parseShortEpg } from '../src/parseShortEpg.mjs'
import { faker } from './factories.mjs'

beforeEach(() => {
  faker.seed(53)
})

const decodeBase64 = (value) => Buffer.from(value, 'base64').toString('utf8')

test('decodifica título e descrição em base64', () => {
  const title = faker.word.words(3)
  const payload = {
    epg_listings: [
      {
        id: 1,
        title: Buffer.from(title).toString('base64'),
        description: Buffer.from('desc').toString('base64'),
        start: '2026-10-30 12:00:00',
        end: '2026-10-30 13:00:00',
        has_archive: 1,
      },
    ],
  }
  const [listing] = parseShortEpg(payload, { decodeBase64 })
  assert.equal(listing.title, title)
  assert.equal(listing.description, 'desc')
  assert.equal(listing.hasArchive, true)
})

test('payload sem listagem vira lista vazia', () => {
  assert.deepEqual(parseShortEpg({}, { decodeBase64 }), [])
})

test('recusa decodificador ausente', () => {
  assert.throws(() => parseShortEpg({}, {}), /decodeBase64/)
})
