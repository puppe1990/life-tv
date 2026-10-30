import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, '.tauri-dist')

/** Copia web/ e src/ para .tauri-dist. */
async function copySources(origin, target) {
  await cp(join(ROOT, origin), join(DIST, target), { recursive: true })
}

/** Reaponta '../src/' → './src/' em cada módulo do web (dist é plano). */
async function rewriteModuleImports() {
  const dir = join(DIST, 'web')
  const modules = (await readdir(dir)).filter((name) => /\.(mjs|js)$/.test(name))
  for (const name of modules) {
    const path = join(dir, name)
    const source = await readFile(path, 'utf8')
    if (source.includes("'../src/")) {
      await writeFile(path, source.replaceAll("'../src/", "'./src/"))
    }
  }
}

/** Gera o diretório que o Tauri embute como frontendDist. */
async function buildTauriDist() {
  await rm(DIST, { recursive: true, force: true })
  await mkdir(DIST, { recursive: true })
  await copySources('web', 'web')
  await copySources('src', 'web/src')
  await rewriteModuleImports()
  return DIST
}

const dist = await buildTauriDist()
console.log(`frontend pronto em ${dist}`)
