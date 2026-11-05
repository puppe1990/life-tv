function stamp(value) {
  return new Date(String(value).replace(' ', 'T')).getTime()
}

/** Hora HH:mm extraída do start Xtream. */
export function epgClock(value) {
  const match = String(value ?? '').match(/\d{2}:\d{2}/)
  return match ? match[0] : String(value ?? '')
}

/** Fração 0–1 da janela EPG já decorrida. */
export function epgProgress({ start, stop, now = Date.now() }) {
  const from = stamp(start)
  const to = stamp(stop)
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0
  if (now <= from) return 0
  if (now >= to) return 1
  return (now - from) / (to - from)
}
