import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  catItemClass,
  catListClass,
  itemClass,
  itemListClass,
  playerNoteClass,
  playerTitleClass,
  playerUrlClass,
  tileClass,
} from '../src/tvSkin.mjs'

test('tileClass selecionado usa phosphor e brass do lounge CRT', () => {
  const cls = tileClass(true)
  assert.match(cls, /text-phosphor/)
  assert.match(cls, /border-brass/)
  assert.match(cls, /min-h-\[220px\]/)
})

test('tileClass ocioso usa ink e line, sem phosphor', () => {
  const cls = tileClass(false)
  assert.match(cls, /text-ink/)
  assert.match(cls, /border-line/)
  assert.equal(cls.includes('text-phosphor'), false)
})

test('itemClass selecionado marca a faixa phosphor', () => {
  const cls = itemClass(true)
  assert.match(cls, /text-phosphor/)
  assert.match(cls, /border-phosphor/)
})

test('playerUrlClass pinta a URL de brass', () => {
  assert.match(playerUrlClass(), /text-brass/)
})

test('listas do catálogo são list-none 10-foot', () => {
  assert.match(catListClass(), /list-none/)
  assert.match(itemListClass(), /list-none/)
  assert.match(catItemClass(), /text-mute/)
})

test('título do player usa a face display do lounge', () => {
  assert.match(playerTitleClass(), /font-display/)
  assert.match(playerNoteClass(), /text-mute/)
})
