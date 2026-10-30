/** Ponte com os comandos do shell Tauri e o storage do webview. */
export function tauriInvoke() {
  const invoke = globalThis.__TAURI__?.core?.invoke
  return typeof invoke === 'function' ? invoke : null
}

export function tauriFetch() {
  const http = globalThis.__TAURI__?.http
  return typeof http?.fetch === 'function' ? http.fetch : null
}

export function localStore() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function webFetch() {
  return tauriFetch() ?? globalThis.fetch.bind(globalThis)
}

export async function saveSecret(account, value) {
  const invoke = tauriInvoke()
  if (!invoke) return false
  try {
    await invoke('secret_set', { account, value })
    return true
  } catch {
    return false
  }
}

export async function readSecret(account) {
  const invoke = tauriInvoke()
  if (!invoke) return null
  try {
    return await invoke('secret_get', { account })
  } catch {
    return null
  }
}

/** Lê o seed local de ajustes (nome, portal, usuário, candidatos). */
export async function readSeed() {
  const invoke = tauriInvoke()
  if (!invoke) return null
  try {
    const raw = await invoke('seed_read')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
