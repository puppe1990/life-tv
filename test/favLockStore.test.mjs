import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createFavLockStore } from '../src/favLockStore.mjs'
import { faker } from './factories.mjs'

beforeEach(() => {
  faker.seed(48)
})

test('alterna favorito do stream do faker', () => {
  const store = createFavLockStore()
  const streamId = faker.number.int({ min: 1000, max: 99_999 })
  assert.equal(store.isFav(streamId), false)
  store.toggleFav(streamId)
  assert.equal(store.isFav(streamId), true)
  store.toggleFav(streamId)
  assert.equal(store.isFav(streamId), false)
})

test('trava canal com pin do faker e só destrava com o mesmo pin', () => {
  const store = createFavLockStore()
  const streamId = faker.number.int({ min: 1000, max: 99_999 })
  const pin = faker.string.numeric(4)
  store.lock(streamId, pin)
  assert.equal(store.isLocked(streamId), true)
  const wrongPin = pin === '0000' ? '1111' : '0000'
  assert.throws(() => store.unlock(streamId, wrongPin), /pin/)
  store.unlock(streamId, pin)
  assert.equal(store.isLocked(streamId), false)
})
