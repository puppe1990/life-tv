/** Duração em minutos entre dois horários "AAAA-MM-DD HH:mm:ss". */
export function minutesBetween(start, stop) {
  const from = new Date(String(start).replace(' ', 'T')).getTime()
  const to = new Date(String(stop).replace(' ', 'T')).getTime()
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    throw new Error(
      `janela recusada: recebido ${JSON.stringify({ start, stop })}, esperado datas AAAA-MM-DD HH:mm:ss`,
    )
  }
  return Math.max(1, Math.round((to - from) / 60_000))
}
