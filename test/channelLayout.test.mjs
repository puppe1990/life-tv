import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  CHANNEL_CARD_PAGE,
  channelLayoutLabel,
  growCardLimit,
  itemsToPaint,
  nextChannelLayout,
} from '../src/channelLayout.mjs'

test('lista troca para cards e cards volta para lista', () => {
  assert.equal(nextChannelLayout('list'), 'card')
  assert.equal(nextChannelLayout('card'), 'list')
})

test('o botão oferece o outro modo', () => {
  assert.equal(channelLayoutLabel('list'), 'Cards')
  assert.equal(channelLayoutLabel('card'), 'Lista')
})

test('modo card só pinta a primeira página', () => {
  const items = Array.from({ length: 80 }, (_, index) => ({ id: index }))
  assert.equal(itemsToPaint(items, 'card', CHANNEL_CARD_PAGE).length, CHANNEL_CARD_PAGE)
  assert.equal(itemsToPaint(items, 'list', CHANNEL_CARD_PAGE).length, 80)
})

test('cresce o limite até o total da categoria', () => {
  assert.equal(growCardLimit(48, 80, 48), 80)
  assert.equal(growCardLimit(80, 80, 48), 80)
})
