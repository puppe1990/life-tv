const PROGRAMME_PATTERN = /<programme\s+([^>]*)>([\s\S]*?)<\/programme>/gi

/** Decodifica as entidades XML usadas nos títulos do xmltv. */
function decodeEntities(text) {
  return text
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
}

/** Lê um atributo do bloco de abertura da tag. */
function attribute(attributes, name) {
  const match = attributes.match(new RegExp(`${name}="([^"]*)"`, 'i'))
  return match ? match[1] : ''
}

/** Lê o texto da primeira tag pedida. */
function tagText(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return match ? decodeEntities(match[1].trim()) : ''
}

/** Extrai os programas do xmltv (canal, janela e título). */
export function parseXmltv(xml) {
  if (typeof xml !== 'string' || !xml.includes('<tv')) {
    throw new Error(
      `xmltv recusado: recebido ${JSON.stringify(String(xml).slice(0, 40))}, esperado <tv>`,
    )
  }
  const programs = []
  for (const match of xml.matchAll(PROGRAMME_PATTERN)) {
    const [, attributes, block] = match
    programs.push({
      channelId: attribute(attributes, 'channel'),
      start: attribute(attributes, 'start'),
      stop: attribute(attributes, 'stop'),
      title: tagText(block, 'title'),
      description: tagText(block, 'desc'),
    })
  }
  return programs.sort((left, right) => left.start.localeCompare(right.start))
}
