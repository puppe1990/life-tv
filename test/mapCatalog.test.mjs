import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { mapCatalog } from '../src/mapCatalog.mjs'
import { faker, fakerCategory, fakerLiveStream, fakerVodStream } from './factories.mjs'

beforeEach(() => {
  faker.seed(44)
})

test('agrupa streams live do faker na categoria correspondente', () => {
  const sports = fakerCategory({ id: 7, name: faker.commerce.department() })
  const news = fakerCategory({ id: 3, name: faker.commerce.department() })
  const a = fakerLiveStream({ categoryId: 7 })
  const b = fakerLiveStream({ categoryId: 7 })
  const c = fakerLiveStream({ categoryId: 3 })
  const catalog = mapCatalog({
    kind: 'live',
    categories: [sports, news],
    streams: [a, b, c],
  })
  assert.equal(catalog.kind, 'live')
  assert.equal(catalog.categories.length, 2)
  const sportsBucket = catalog.categories.find((cat) => cat.id === '7')
  assert.equal(sportsBucket.name, sports.category_name)
  assert.equal(sportsBucket.items.length, 2)
  assert.equal(sportsBucket.items[0].id, a.stream_id)
  assert.equal(sportsBucket.items[0].name, a.name)
  assert.equal(sportsBucket.items[0].icon, a.stream_icon)
  const newsBucket = catalog.categories.find((cat) => cat.id === '3')
  assert.equal(newsBucket.items[0].id, c.stream_id)
})

test('vod carrega container_extension do faker', () => {
  const cat = fakerCategory({ id: 11 })
  const vod = fakerVodStream({ categoryId: 11 })
  const catalog = mapCatalog({ kind: 'vod', categories: [cat], streams: [vod] })
  assert.equal(catalog.categories[0].items[0].extension, vod.container_extension)
  assert.equal(catalog.categories[0].items[0].id, vod.stream_id)
})

test('omite categoria sem streams', () => {
  const empty = fakerCategory({ id: 99 })
  const filled = fakerCategory({ id: 2 })
  const stream = fakerLiveStream({ categoryId: 2 })
  const catalog = mapCatalog({
    kind: 'live',
    categories: [empty, filled],
    streams: [stream],
  })
  assert.equal(catalog.categories.length, 1)
  assert.equal(catalog.categories[0].id, '2')
})
