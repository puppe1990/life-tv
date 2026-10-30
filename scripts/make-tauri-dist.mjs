import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, '.tauri-dist')

/** Copia web/ e src/ para .tauri-dist e reaponta os imports relativos. */
async function copySources(origin, target) {
  await cp(join(ROOT, origin), join(DIST, target), { recursive: true })
}

/** Troca "../src/" por "./src/" porque o dist é plano. */
async function rewriteAppImports() {
  const appPath = join(DIST, 'web', 'app.js')
  const source = await readFile(appPath, 'utf8')
  await writeFile(appPath, source.replaceAll("'../src/", "'./src/"))
}

/** Gera o diretório que o Tauri embute como frontendDist. */
async function buildTauriDist() {
  await rm(DIST, { recursive: true, force: true })
  await mkdir(DIST, { recursive: true })
  await copySources('web', 'web')
  await copySources('src', 'web/src')
  await rewriteAppImports()
  return DIST
}

const dist = await buildTauriDist()
console.log(`frontend pronto em ${dist}`)
