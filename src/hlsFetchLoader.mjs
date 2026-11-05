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
      this.stats = emptyStats()
      this.abortController = typeof AbortController === 'function' ? new AbortController() : null
      const started = Date.now()
      this.stats.loading.start = started
      const init = this.abortController ? { signal: this.abortController.signal } : {}
      fetchFn(context.url, init)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`hls http ${response.status}`)
          }
          this.stats.loading.first = Date.now()
          const data = await readBody(response, context.responseType)
          this.stats.loaded = this.stats.total = byteLength(data)
          this.stats.loading.end = Date.now()
          callbacks.onSuccess(
            { url: response.url || context.url, data },
            this.stats,
            context,
            response,
          )
        })
        .catch((error) => {
          if (this.abortController?.signal.aborted) {
            this.stats.aborted = true
            callbacks.onAbort?.(this.stats, context, null)
            return
          }
          callbacks.onError({ code: 0, text: error.message }, context, null, this.stats)
        })
    }

    abort() {
      this.abortController?.abort()
    }

    destroy() {
      this.abort()
    }
  }
}
