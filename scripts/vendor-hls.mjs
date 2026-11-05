import { cp, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FROM = join(ROOT, 'node_modules/hls.js/dist/hls.light.min.mjs')
const TO_DIR = join(ROOT, 'web/vendor')

await mkdir(TO_DIR, { recursive: true })
await cp(FROM, join(TO_DIR, 'hls.mjs'))
