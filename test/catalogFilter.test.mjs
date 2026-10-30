import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { filterCategories } from '../src/catalogFilter.mjs'
import { faker } from './factories.mjs'

beforeEach(() => {
  faker.seed(56)
})

function sampleCategories() {
  return [
    { id: '1', name: 'Notícias', items: [{ id: 1, name: 'TV Cultura' }] },
    { id: '2', name: 'Esporte', items: [{ id: 2, name: 'SporTV' }] },
  ]
}

test('sem termo devolve tudo com o índice original', () => {
  const categories = filterCategories(sampleCategories(), '')
  assert.equal(categories.length, 2)
  assert.deepEqual(
    categories.map((category) => category.sourceIndex),
    [0, 1],
  )
})

test('filtra por nome do item mantendo sourceIndex', () => {
  const categories = filterCategories(sampleCategories(), 'cultura')
  assert.equal(categories.length, 1)
  assert.equal(categories[0].sourceIndex, 0)
  assert.equal(categories[0].items.length, 1)
})

test('ignora categoria sem item correspondente', () => {
  const categories = filterCategories(sampleCategories(), 'espn')
  assert.deepEqual(categories, [])
})

test('termo com espaços é aparado e case-insensitive', () => {
  const termo = `  ${faker.word.words(1).toUpperCase()}  `
  const categories = filterCategories(
    [{ id: '1', name: 'A', items: [{ id: 1, name: termo.trim().toLowerCase() }] }],
    termo,
  )
  assert.equal(categories.length, 1)
})
