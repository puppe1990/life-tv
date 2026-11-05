import assert from 'node:assert/strict'
import { test } from 'node:test'
import { channelMark } from '../src/channelMark.mjs'

test('marca usa as duas primeiras letras de um nome só', () => {
  assert.equal(channelMark('Globo'), 'GL')
})

test('marca junta a inicial do nome com o número do canal', () => {
  assert.equal(channelMark('ESPN 1 HD'), 'E1')
})

test('marca ignora sufixo de qualidade e junta duas palavras', () => {
  assert.equal(channelMark('CNN Brasil'), 'CB')
  assert.equal(channelMark('SporTV HD'), 'SP')
})

test('marca vazia cai em TV', () => {
  assert.equal(channelMark(''), 'TV')
  assert.equal(channelMark('   '), 'TV')
})
