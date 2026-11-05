import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { itemFromWatchCard, watchCardFromItem } from '../src/watchCard.mjs'
import { faker } from './factories.mjs'

beforeEach(() => {
  faker.seed(92)
})

test('watchCardFromItem tira o retrato do item do catálogo', () => {
  const item = {
    id: faker.number.int({ min: 100, max: 9999 }),
    name: 'ESPN 1 HD',
    icon: 'http://cdn.example.net/espn.png',
    url: 'http://cdn.example.net/espn.m3u8',
    extension: 'm3u8',
  }
  const card = watchCardFromItem(item, 'live')
  assert.deepEqual(card, {
    streamId: String(item.id),
    name: 'ESPN 1 HD',
    catalogKind: 'live',
    icon: item.icon,
    url: item.url,
    extension: 'm3u8',
  })
})

test('itemFromWatchCard reconstitui o item pra abrir o player', () => {
  const card = {
    streamId: '521',
    name: 'ESPN 1 HD',
    catalogKind: 'live',
    icon: 'http://cdn.example.net/espn.png',
    url: 'http://cdn.example.net/espn.m3u8',
    extension: 'm3u8',
  }
  assert.deepEqual(itemFromWatchCard(card), {
    id: '521',
    name: 'ESPN 1 HD',
    icon: card.icon,
    url: card.url,
    extension: 'm3u8',
  })
})
