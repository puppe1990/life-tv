import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { withAllCategory } from '../src/allCategory.mjs'
import { faker } from './factories.mjs'

beforeEach(() => {
  faker.seed(81)
})

test('coloca Todos na frente com todos os canais na ordem das categorias', () => {
  const sports = faker.commerce.department()
  const news = faker.commerce.department()
  const a = { id: faker.number.int({ min: 10, max: 99 }), name: faker.company.name() }
  const b = { id: faker.number.int({ min: 100, max: 199 }), name: faker.company.name() }
  const c = { id: faker.number.int({ min: 200, max: 299 }), name: faker.company.name() }
  const categories = withAllCategory([
    { id: '1', name: sports, items: [a, b] },
    { id: '2', name: news, items: [c] },
  ])
  assert.equal(categories[0].id, 'all')
  assert.equal(categories[0].name, 'Todos')
  assert.deepEqual(
    categories[0].items.map((item) => item.id),
    [a.id, b.id, c.id],
  )
  assert.equal(categories[1].name, sports)
  assert.equal(categories[2].name, news)
})

test('não duplica canal que aparece em duas categorias', () => {
  const shared = { id: faker.number.int({ min: 10, max: 99 }), name: faker.company.name() }
  const extra = { id: faker.number.int({ min: 100, max: 199 }), name: faker.company.name() }
  const categories = withAllCategory([
    { id: '1', name: 'A', items: [shared] },
    { id: '2', name: 'B', items: [shared, extra] },
  ])
  assert.equal(categories[0].items.length, 2)
  assert.equal(categories[0].items[0].id, shared.id)
  assert.equal(categories[0].items[1].id, extra.id)
})

test('não empilha Todos duas vezes', () => {
  const item = { id: 1, name: faker.company.name() }
  const once = withAllCategory([{ id: '1', name: 'A', items: [item] }])
  const twice = withAllCategory(once)
  assert.equal(twice.filter((category) => category.id === 'all').length, 1)
  assert.equal(twice[0].items.length, 1)
})

test('lista vazia continua vazia', () => {
  assert.deepEqual(withAllCategory([]), [])
  assert.deepEqual(withAllCategory(null), [])
})
