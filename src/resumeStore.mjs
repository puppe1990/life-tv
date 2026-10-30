const MIN_RESUME_MS = 10_000
const DONE_RATIO = 0.9

/** Resume: grava entre 10s e 90% da duração (padrão do player FlexTV). */
export function createResumeStore({ bucket = null } = {}) {
  const byId = new Map(Object.entries(bucket?.read() ?? {}))
  function persist() {
    bucket?.write(Object.fromEntries(byId))
  }
  return {
    save({ streamId, positionMs, durationMs }) {
      const key = String(streamId)
      if (positionMs < MIN_RESUME_MS) return
      if (durationMs > 0 && positionMs / durationMs >= DONE_RATIO) {
        byId.delete(key)
        persist()
        return
      }
      byId.set(key, { streamId, positionMs, durationMs })
      persist()
    },
    load(streamId) {
      return byId.get(String(streamId)) ?? null
    },
  }
}
