import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { faker } from './factories.mjs'
import { createJsonBucket } from '../src/jsonBucket.mjs'
import { EPG_TTL_MS, readFreshGuide, writeGuideCache } from '../src/epgGuideCache.mjs'

beforeEach(() => {
  faker.seed(84)
})

function programs() {
  return [
    {
      channelId: faker.string.alpha(6),
      start: '20261030180000 +0000',
      stop: '20261030200000 +0000',
      title: faker.word.words(2),
    },
  ]
}

test('grava e lê o xmltv fresco da playlist', () => {
  const bucket = createJsonBucket({ key: 'life-tv:epg' })
  const playlistId = faker.string.alphanumeric(8)
  const list = programs()
  const now = faker.date.recent().getTime()
  writeGuideCache(bucket, { playlistId, programs: list, now })
  assert.deepEqual(readFreshGuide(bucket, { playlistId, now }), list)
})

test('xmltv vencido não é reusado', () => {
  const bucket = createJsonBucket({ key: 'life-tv:epg' })
  const playlistId = faker.string.alphanumeric(8)
  const savedAt = faker.date.recent().getTime()
  writeGuideCache(bucket, { playlistId, programs: programs(), now: savedAt })
  assert.equal(readFreshGuide(bucket, { playlistId, now: savedAt + EPG_TTL_MS + 1 }), null)
})
