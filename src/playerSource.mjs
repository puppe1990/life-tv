const HLS_TYPE = 'application/vnd.apple.mpegurl'
const PROGRESSIVE_EXTENSIONS = ['.mp4', '.m4v', '.webm']
const SIDECAR_EXTENSIONS = ['.ts', '.mkv']

/** Path da URL sem query, em minúsculas. */
function pathOf(url) {
  return url.split('?')[0].toLowerCase()
}

/** Decide como o player deve tratar a URL: HLS nativo, progressivo ou sidecar. */
export function resolvePlayerSource(url, { canPlay = () => '' } = {}) {
  if (typeof url !== 'string' || url.trim() === '') {
    throw new Error(`url recusada: recebida ${JSON.stringify(url)}, esperado texto`)
  }
  const path = pathOf(url)
  if (path.endsWith('.m3u8')) {
    return canPlay(HLS_TYPE)
      ? { kind: 'hls', url }
      : { kind: 'unsupported', url, reason: 'HLS sem suporte nativo' }
  }
  if (PROGRESSIVE_EXTENSIONS.some((extension) => path.endsWith(extension))) {
    return { kind: 'progressive', url }
  }
  if (SIDECAR_EXTENSIONS.some((extension) => path.endsWith(extension))) {
    return { kind: 'sidecar', url, reason: 'MPEG-TS/MKV tocado pelo mpv do Tauri' }
  }
  return { kind: 'unsupported', url, reason: `container sem player: ${path}` }
}
