import assert from 'node:assert/strict'
import { test } from 'node:test'
import { epgClock, epgProgress } from '../src/epgProgress.mjs'

test('progresso no começo da janela é zero', () => {
  const value = epgProgress({
    start: '2026-11-04 16:00:00',
    stop: '2026-11-04 18:00:00',
    now: Date.parse('2026-11-04T16:00:00'),
  })
  assert.equal(value, 0)
})

test('progresso no meio da janela é metade', () => {
  const value = epgProgress({
    start: '2026-11-04 16:00:00',
    stop: '2026-11-04 18:00:00',
    now: Date.parse('2026-11-04T17:00:00'),
  })
  assert.equal(value, 0.5)
})

test('progresso depois do fim satura em 1', () => {
  const value = epgProgress({
    start: '2026-11-04 16:00:00',
    stop: '2026-11-04 18:00:00',
    now: Date.parse('2026-11-04T19:00:00'),
  })
  assert.equal(value, 1)
})

test('janela inválida devolve zero', () => {
  assert.equal(epgProgress({ start: 'x', stop: 'y', now: 0 }), 0)
})

test('relógio do EPG mostra só a hora', () => {
  assert.equal(epgClock('2026-11-04 16:00:00'), '16:00')
  assert.equal(epgClock('18:15'), '18:15')
})
