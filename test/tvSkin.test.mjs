import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  actionClass,
  playlistChipClass,
  catCountClass,
  catItemClass,
  catListClass,
  ghostClass,
  itemClass,
  itemListClass,
  liveBadgeClass,
  playerNoteClass,
  playerTitleClass,
  playerUrlClass,
  tabClass,
  tileClass,
} from '../src/tvSkin.mjs'

test('tile selecionado usa o vermelho de destaque', () => {
  const cls = tileClass(true)
  assert.match(cls, /ring-accent/)
  assert.match(cls, /bg-row/)
})

test('tile ocioso fica no painel escuro', () => {
  const cls = tileClass(false)
  assert.match(cls, /text-ink/)
  assert.match(cls, /bg-panel/)
  assert.equal(cls.includes('ring-accent'), false)
})

test('item selecionado marca o anel vermelho', () => {
  const cls = itemClass(true)
  assert.match(cls, /ring-accent/)
  assert.match(cls, /bg-row/)
})

test('chip de categoria ativa é vermelho cheio', () => {
  assert.match(catItemClass(true), /bg-accent/)
  assert.equal(catItemClass(false).includes('bg-accent'), false)
  assert.match(catCountClass(), /text-mute/)
})

test('aba ativa fica branca e em negrito', () => {
  assert.match(tabClass(true), /text-ink/)
  assert.match(tabClass(true), /font-bold/)
  assert.match(tabClass(false), /text-mute/)
})

test('ação primária é o botão branco de assistir', () => {
  assert.match(actionClass(), /bg-action/)
  assert.match(actionClass(), /text-void/)
  assert.match(actionClass(), /cursor-pointer/)
})

test('ação secundária é superfície fumê', () => {
  assert.match(ghostClass(), /bg-row/)
  assert.match(ghostClass(), /text-ink/)
})

test('chip da playlist ativa usa o vermelho', () => {
  assert.match(playlistChipClass(true), /bg-accent/)
  assert.match(playlistChipClass(false), /bg-panel/)
})

test('selo ao vivo usa o vermelho da marca', () => {
  assert.match(liveBadgeClass(), /bg-accent/)
})

test('player usa URL em cinza e título Chivo', () => {
  assert.match(playerUrlClass(), /text-mute/)
  assert.match(playerTitleClass(), /font-display/)
  assert.match(playerNoteClass(), /text-mute/)
})

test('listas do catálogo são list-none 10-foot', () => {
  assert.match(catListClass(), /list-none/)
  assert.match(itemListClass(), /list-none/)
})

test('chips de categoria ficam numa faixa horizontal', () => {
  const cls = catListClass()
  assert.match(cls, /flex-nowrap/)
  assert.match(cls, /overflow-x-auto/)
  assert.equal(cls.includes('flex-wrap'), false)
})
