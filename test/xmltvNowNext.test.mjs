import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { faker } from './factories.mjs'
import { nowAndNext, parseXmltvStamp } from '../src/xmltvNowNext.mjs'
import { parseXmltv } from '../src/parseXmltv.mjs'

beforeEach(() => {
  faker.seed(83)
})

test('parseXmltvStamp lê data xmltv com fuso', () => {
  assert.equal(parseXmltvStamp('20261030200000 +0000'), Date.UTC(2026, 9, 30, 20, 0, 0))
  assert.equal(parseXmltvStamp('20261030180000 -0300'), Date.UTC(2026, 9, 30, 21, 0, 0))
})

test('nowAndNext devolve o programa no ar e o seguinte', () => {
  const channel = faker.string.alpha(6)
  const current = faker.word.words(2)
  const upcoming = faker.word.words(2)
  const xml = `<tv>
    <programme start="20261030180000 +0000" stop="20261030200000 +0000" channel="${channel}">
      <title>${current}</title>
    </programme>
    <programme start="20261030200000 +0000" stop="20261030220000 +0000" channel="${channel}">
      <title>${upcoming}</title>
    </programme>
  </tv>`
  const programs = parseXmltv(xml)
  const now = Date.UTC(2026, 9, 30, 19, 0, 0)
  const listing = nowAndNext(programs, { channelId: channel, now })
  assert.equal(listing.title, current)
  assert.equal(listing.start, '2026-10-30T18:00:00.000Z')
  assert.equal(listing.stop, '2026-10-30T20:00:00.000Z')
  assert.equal(listing.nextTitle, upcoming)
})

test('canal sem programa agora devolve null', () => {
  const programs = parseXmltv(
    `<tv><programme start="20261030180000 +0000" stop="20261030190000 +0000" channel="a"><title>X</title></programme></tv>`,
  )
  assert.equal(
    nowAndNext(programs, { channelId: 'b', now: Date.UTC(2026, 9, 30, 18, 30, 0) }),
    null,
  )
})
