import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fullscreenButtonLabel, shouldConsumeEscape } from '../src/fullscreen.mjs'

test('rótulo entra e sai da tela cheia', () => {
  assert.equal(fullscreenButtonLabel(false), 'Tela cheia')
  assert.equal(fullscreenButtonLabel(true), 'Sair da tela cheia')
})

test('rótulo recusa valor que não é boolean', () => {
  assert.throws(() => fullscreenButtonLabel('sim'), /boolean/)
})

test('Esc no player fullscreen não volta pro catálogo', () => {
  assert.equal(shouldConsumeEscape(true), true)
  assert.equal(shouldConsumeEscape(false), false)
})
