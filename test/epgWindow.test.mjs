import assert from 'node:assert/strict'
import { test } from 'node:test'
import { minutesBetween } from '../src/epgWindow.mjs'

test('conta os minutos entre dois horários do Xtream', () => {
  assert.equal(minutesBetween('2026-10-30 12:00:00', '2026-10-30 13:30:00'), 90)
})

test('nunca devolve menos de um minuto', () => {
  assert.equal(minutesBetween('2026-10-30 12:00:00', '2026-10-30 12:00:00'), 1)
})

test('recusa data inválida com o valor recebido', () => {
  assert.throws(() => minutesBetween('ontem', '2026-10-30 13:00:00'), /janela recusada/)
})
