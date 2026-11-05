/** Converte stamp xmltv `YYYYMMDDHHmmss ±HHMM` em epoch ms. */
export function parseXmltvStamp(value) {
  const match = String(value).match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-]\d{4}))?/,
  )
  if (!match) return NaN
  const [, year, month, day, hour, minute, second, zone] = match
  const utc = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second)
  if (!zone) return utc
  const sign = zone.startsWith('-') ? -1 : 1
  const offsetMinutes = sign * (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(3, 5)))
  return utc - offsetMinutes * 60_000
}

function withWindow(item) {
  return {
    ...item,
    from: parseXmltvStamp(item.start),
    to: parseXmltvStamp(item.stop),
  }
}

/** Programa no ar (e o título do seguinte) para um epg_channel_id. */
export function nowAndNext(programs, { channelId, now = Date.now() }) {
  if (!channelId || !Array.isArray(programs)) return null
  const rows = programs.map(withWindow).filter((item) => item.channelId === channelId)
  const current = rows.find((item) => item.from <= now && now < item.to)
  if (!current) return null
  const upcoming = rows.find((item) => item.from >= current.to)
  return {
    title: current.title,
    start: new Date(current.from).toISOString(),
    stop: new Date(current.to).toISOString(),
    nextTitle: upcoming?.title ?? '',
  }
}
