function readAttrs(header) {
  const fields = {}
  const attr = /(tvg-id|tvg-name|tvg-logo|group-title)="([^"]*)"/gi
  for (const match of header.matchAll(attr)) {
    fields[match[1].toLowerCase()] = match[2]
  }
  return fields
}

function splitExtinf(line) {
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') inQuote = !inQuote
    else if (ch === ',' && !inQuote) {
      return { header: line.slice(0, i), title: line.slice(i + 1).trim() }
    }
  }
  return { header: line, title: '' }
}

function readExtinf(line, nextLine) {
  const { header, title } = splitExtinf(line)
  const fields = readAttrs(header)
  const url = (nextLine ?? '').trim()
  if (!url || url.startsWith('#')) return null
  return {
    title,
    group: fields['group-title'] ?? '',
    tvgId: fields['tvg-id'] ?? '',
    tvgLogo: fields['tvg-logo'] ?? '',
    url,
  }
}

/** Parse #EXTM3U; vírgula do título ignora aspas dos atributos. */
export function parseM3u(text) {
  if (typeof text !== 'string' || !/^\s*#EXTM3U/i.test(text)) {
    throw new Error(
      `m3u recusado: recebido ${JSON.stringify(text)?.slice(0, 80)}, esperado #EXTM3U`,
    )
  }
  const lines = text.split(/\r?\n/)
  const items = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.startsWith('#EXTINF:')) continue
    const item = readExtinf(line, lines[i + 1])
    if (item) items.push(item)
  }
  if (items.length === 0) {
    throw new Error('m3u recusado: recebido sem EXTINF, esperado pelo menos um item')
  }
  return { items }
}
