/** Lista o now/next do get_short_epg decodificando título e descrição. */
export function parseShortEpg(payload, { decodeBase64 } = {}) {
  if (typeof decodeBase64 !== 'function') {
    throw new Error('epg recusado: recebido decodeBase64 ausente, esperado função')
  }
  const listings = payload?.epg_listings
  if (!Array.isArray(listings)) {
    return []
  }
  return listings.map((item) => ({
    id: String(item.id ?? ''),
    title: decodeBase64(item.title ?? ''),
    description: decodeBase64(item.description ?? ''),
    start: item.start ?? '',
    stop: item.end ?? '',
    hasArchive: Number(item.has_archive ?? 0) === 1,
  }))
}
