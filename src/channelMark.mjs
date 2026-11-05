const SKIP = new Set(['HD', 'FHD', 'UHD', 'SD', '4K', '8K', 'HDR'])

function tokens(name) {
  return String(name ?? '')
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean)
}

function keep(token) {
  return !SKIP.has(token.toUpperCase())
}

/** Iniciais do canal para o selo 10-foot (ESPN 1 HD → E1). */
export function channelMark(name) {
  const words = tokens(name).filter(keep)
  if (words.length === 0) return 'TV'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
