import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { parseXmltv } from '../src/parseXmltv.mjs'
import { faker } from './factories.mjs'

beforeEach(() => {
  faker.seed(51)
})

test('extrai programas do xmltv em ordem de horário', () => {
  const channel = faker.string.alpha(6)
  const late = faker.word.words(2)
  const early = faker.word.words(2)
  const xml = `<tv>
    <programme start="20261030200000 +0000" stop="20261030210000 +0000" channel="${channel}">
      <title>${late}</title><desc>depois</desc>
    </programme>
    <programme start="20261030180000 +0000" stop="20261030190000 +0000" channel="${channel}">
      <title>${early}</title><desc>antes</desc>
    </programme>
  </tv>`
  const programs = parseXmltv(xml)
  assert.equal(programs.length, 2)
  assert.equal(programs[0].title, early)
  assert.equal(programs[1].title, late)
  assert.equal(programs[0].channelId, channel)
})

test('decodifica entidades do título', () => {
  const xml =
    '<tv><programme start="1" stop="2" channel="c"><title>A &amp; B</title></programme></tv>'
  assert.equal(parseXmltv(xml)[0].title, 'A & B')
})

test('recusa texto que não é xmltv', () => {
  assert.throws(() => parseXmltv('{"json":true}'), /xmltv recusado/)
})
