const MIME_BY_EXT = {
  m3u8: 'application/x-mpegURL',
  mpd: 'application/dash+xml',
  ts: 'video/MP2T',
  mp4: 'video/mp4',
  mkv: 'video/x-matroska',
}

function pathnameOf(uri) {
  try {
    return new URL(uri).pathname
  } catch {
    return uri.split('?')[0]
  }
}

/** MIME HLS/DASH/TS/MP4/MKV pela extensão da URI (query ignorada). */
export function inferAdaptiveMime(uri) {
  if (typeof uri !== 'string' || uri.trim() === '') {
    throw new Error(`mime recusado: recebido ${JSON.stringify(uri)}, esperado URI`)
  }
  const ext = pathnameOf(uri).split('.').pop()?.toLowerCase()
  return MIME_BY_EXT[ext] ?? null
}
