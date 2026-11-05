import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('Info.plist do .app libera HTTP do WebKit para o stream', async () => {
  const script = await readFile(new URL('../scripts/build-macos-app.sh', import.meta.url), 'utf8')
  assert.match(script, /NSAppTransportSecurity/)
  assert.match(script, /<key>NSAllowsArbitraryLoads<\/key>/)
  assert.match(script, /NSAllowsArbitraryLoadsForMedia/)
  assert.match(script, /NSAllowsArbitraryLoadsInWebContent/)
  assert.match(script, /NSAllowsLocalNetworking/)
})
