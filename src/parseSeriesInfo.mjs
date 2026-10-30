/** Achata o mapa de temporadas do get_series_info em lista ordenada. */
export function flattenEpisodes(payload) {
  const seasons = payload?.episodes
  if (!seasons || typeof seasons !== 'object') {
    throw new Error(
      `série recusada: recebido ${JSON.stringify(payload?.episodes)}, esperado mapa de temporadas`,
    )
  }
  const episodes = []
  for (const [season, list] of Object.entries(seasons)) {
    if (!Array.isArray(list)) continue
    for (const item of list) {
      episodes.push({
        id: String(item.id),
        season: Number(season),
        episode: Number(item.episode_num ?? 0),
        title: item.title ?? '',
        extension: item.container_extension ?? 'mp4',
      })
    }
  }
  return episodes.sort((left, right) => left.season - right.season || left.episode - right.episode)
}
