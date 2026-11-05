import { createHlsFetchLoader } from './hlsFetchLoader.mjs'

const HLS_TYPE = 'application/vnd.apple.mpegurl'

function playNative(video, url) {
  video.src = url
  return {
    kind: 'native',
    destroy() {
      video.removeAttribute('src')
    },
  }
}

function playHlsJs(video, url, Hls, fetchFn, onFatalError) {
  const hls = new Hls({
    enableWorker: false,
    lowLatencyMode: false,
    loader: createHlsFetchLoader(fetchFn),
  })
  if (typeof hls.on === 'function' && Hls.Events?.ERROR) {
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data?.fatal) onFatalError?.(data)
    })
  }
  hls.loadSource(url)
  hls.attachMedia(video)
  return {
    kind: 'hlsjs',
    destroy() {
      hls.destroy()
    },
  }
}

/**
 * Liga o HLS no <video>: nativo quando o webview busca HTTP, hls.js+fetch no Tauri.
 */
export function attachHlsPlayback(
  video,
  url,
  { Hls, fetch: fetchFn, canPlay = () => '', preferNative = false, onFatalError } = {},
) {
  if (typeof url !== 'string' || url.trim() === '') {
    throw new Error(`url recusada: recebida ${JSON.stringify(url)}, esperado texto`)
  }
  if (preferNative && canPlay(HLS_TYPE)) return playNative(video, url)
  if (Hls?.isSupported?.()) {
    if (typeof fetchFn !== 'function') {
      throw new Error(`fetch recusado: recebido ${typeof fetchFn}, esperado função`)
    }
    return playHlsJs(video, url, Hls, fetchFn, onFatalError)
  }
  if (canPlay(HLS_TYPE)) return playNative(video, url)
  throw new Error('HLS sem suporte nativo e sem hls.js')
}
