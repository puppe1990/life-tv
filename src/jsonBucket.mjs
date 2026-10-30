const KEY_PATTERN = /^[a-z0-9:_-]+$/i

/** Lê o JSON guardado, tolerando storage ausente ou corrompido. */
function readStored(storage, key) {
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Grava o JSON no storage; storage cheio mantém só a cópia em memória. */
function persist(storage, key, value) {
  if (!storage) return
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

/** Bucket JSON sobre um Storage-like (localStorage), com fallback em memória. */
export function createJsonBucket({ storage = null, key }) {
  if (typeof key !== 'string' || !KEY_PATTERN.test(key)) {
    throw new Error(
      `bucket recusado: recebida chave ${JSON.stringify(key)}, esperada chave [a-z0-9:_-]`,
    )
  }
  let memory = readStored(storage, key)
  return {
    read() {
      return memory
    },
    write(value) {
      memory = value
      persist(storage, key, value)
    },
  }
}
