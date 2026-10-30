import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  actionClass,
  catCountClass,
  catItemClass,
  catListClass,
  itemClass,
  itemListClass,
  playerNoteClass,
  playerTitleClass,
  playerUrlClass,
  tabClass,
  tileClass,
} from '../src/tvSkin.mjs'

test('tileClass selecionado usa o amarelo de destaque do APK', () => {
  const cls = tileClass(true)
  assert.match(cls, /text-accent/)
  assert.match(cls, /border-accent/)
  assert.match(cls, /bg-row/)
})

test('tileClass ocioso fica no painel escuro', () => {
  const cls = tileClass(false)
  assert.match(cls, /text-ink/)
  assert.match(cls, /border-line/)
  assert.equal(cls.includes('text-accent'), false)
})

test('itemClass selecionado marca a faixa amarela', () => {
  const cls = itemClass(true)
  assert.match(cls, /text-accent/)
  assert.match(cls, /border-accent/)
  assert.match(cls, /bg-row/)
})

test('catItemClass marca categoria ativa e conta em cinza', () => {
  assert.match(catItemClass(true), /text-accent/)
  assert.equal(catItemClass(false).includes('text-accent'), false)
  assert.match(catCountClass(), /text-mute/)
})

test('abas usam amarelo quando ativas', () => {
  assert.match(tabClass(true), /text-accent/)
  assert.match(tabClass(false), /text-ink/)
})

test('ação é botão cheio azul', () => {
  assert.match(actionClass(), /bg-action/)
  assert.match(actionClass(), /cursor-pointer/)
})

test('player usa URL em cinza e título sem serifa', () => {
  assert.match(playerUrlClass(), /text-mute/)
  assert.match(playerTitleClass(), /font-semibold/)
  assert.match(playerNoteClass(), /text-mute/)
})

test('listas do catálogo são list-none 10-foot', () => {
  assert.match(catListClass(), /list-none/)
  assert.match(itemListClass(), /list-none/)
})
