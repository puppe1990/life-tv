function emptyStats() {
  return {
    aborted: false,
    loaded: 0,
    retry: 0,
    total: 0,
    chunkCount: 0,
    bwEstimate: 0,
    loading: { start: 0, first: 0, end: 0 },
    parsing: { start: 0, end: 0 },
    buffering: { start: 0, first: 0, end: 0 },
  }
}

function readBody(response, responseType) {
  if (responseType === 'text' || responseType === 'json') return response.text()
  return response.arrayBuffer()
}

function byteLength(data) {
  if (typeof data === 'string') return data.length
  return data?.byteLength ?? 0
}

function nowMs() {
  return globalThis.performance?.now?.() ?? 0
}

/** Loader do hls.js que usa o fetch do shell (Rust), sem XHR/CORS do webview. */
export function createHlsFetchLoader(fetchFn) {
  if (typeof fetchFn !== 'function') {
    throw new Error(`fetch recusado: recebido ${typeof fetchFn}, esperado função`)
  }
  return class HlsFetchLoader {
    constructor(config) {
      this.config = config
      this.stats = emptyStats()
      this.context = null
      this.abortController = null
    }

    load(context, _config, callbacks) {
      this.context = context
      const stats = this.stats
      stats.aborted = false
      stats.loaded = 0
      stats.total = 0
      stats.loading.first = 0
      stats.loading.end = 0
      this.abortController = typeof AbortController === 'function' ? new AbortController() : null
      stats.loading.start = nowMs()
      const init = this.abortController ? { signal: this.abortController.signal } : {}
      fetchFn(context.url, init)
        .then(async (response) => {
          if (stats.aborted) return
          if (!response.ok) {
            throw new Error(`hls http ${response.status}`)
          }
          stats.loading.first = Math.max(nowMs(), stats.loading.start)
          const data = await readBody(response, context.responseType)
          if (stats.aborted) return
          stats.loaded = stats.total = byteLength(data)
          stats.loading.end = Math.max(nowMs(), stats.loading.first)
          callbacks.onSuccess(
            { url: response.url || context.url, data, code: response.status },
            stats,
            context,
            response,
          )
        })
        .catch((error) => {
          if (stats.aborted) {
            callbacks.onAbort?.(stats, context, null)
            return
          }
          callbacks.onError({ code: 0, text: error.message }, context, null, stats)
        })
    }

    abort() {
      this.stats.aborted = true
      this.abortController?.abort()
    }

    destroy() {
      this.abort()
    }
  }
}
