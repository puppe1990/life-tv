const KEY_PATTERN = /^[a-z0-9:_-]+$/i

function requireKey(key) {
  if (typeof key !== 'string' || !KEY_PATTERN.test(key)) {
    throw new Error(
      `bucket recusado: recebida chave ${JSON.stringify(key)}, esperada chave [a-z0-9:_-]`,
    )
  }
  return key
}

function parseStored(raw) {
  if (raw == null || raw === '') return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function loadSqlite(invoke, key) {
  try {
    return parseStored(await invoke('db_get', { key }))
  } catch {
    return null
  }
}

function queueWrite(writes, invoke, key, value) {
  const body = JSON.stringify(value)
  return writes.then(() => invoke('db_set', { key, value: body })).catch(() => {})
}

function memoryBucket(invoke, bucketKey) {
  let memory = null
  let writes = Promise.resolve()
  return {
    async load() {
      memory = await loadSqlite(invoke, bucketKey)
      return memory
    },
    read() {
      return memory
    },
    write(value) {
      memory = value
      writes = queueWrite(writes, invoke, bucketKey, value)
      return writes
    },
  }
}

/** Bucket JSON sobre comandos Tauri db_get/db_set, com cópia em memória. */
export function createSqliteBucket({ invoke, key }) {
  if (typeof invoke !== 'function') {
    throw new Error(`bucket recusado: recebido invoke ${typeof invoke}, esperada função`)
  }
  return memoryBucket(invoke, requireKey(key))
}

/** Copia chaves do localStorage para o sqlite só quando a chave ainda não existe. */
export async function migrateLocalToSqlite({ invoke, storage, keys }) {
  if (typeof invoke !== 'function') {
    throw new Error(`migrate recusada: recebido invoke ${typeof invoke}, esperada função`)
  }
  if (!Array.isArray(keys)) {
    throw new Error(`migrate recusada: recebido keys ${JSON.stringify(keys)}, esperada lista`)
  }
  for (const key of keys) {
    requireKey(key)
    const existing = await invoke('db_get', { key })
    if (existing != null) continue
    const raw = storage?.getItem?.(key)
    if (raw == null) continue
    await invoke('db_set', { key, value: raw })
  }
}
