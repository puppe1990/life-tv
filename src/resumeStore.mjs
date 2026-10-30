const MIN_RESUME_MS = 10_000
const DONE_RATIO = 0.9

/** Resume: grava entre 10s e 90% da duração (padrão do player FlexTV). */
export function createResumeStore() {
  const byId = new Map()
  return {
    save({ streamId, positionMs, durationMs }) {
      if (positionMs < MIN_RESUME_MS) return
      if (durationMs > 0 && positionMs / durationMs >= DONE_RATIO) {
        byId.delete(streamId)
        return
      }
      byId.set(streamId, { streamId, positionMs, durationMs })
    },
    load(streamId) {
      return byId.get(streamId) ?? null
    },
  }
}
