/** Normaliza o get_vod_info do Xtream para o hero da home. */
export function parseVodInfo(payload) {
  const info = payload?.info ?? {}
  const movie = payload?.movie_data ?? {}
  const year = String(info.releasedate ?? info.release_date ?? info.year ?? '')
  return {
    title: info.name ?? movie.name ?? '',
    plot: info.plot ?? info.description ?? '',
    year: year.slice(0, 4),
    poster: info.movie_image ?? movie.stream_icon ?? '',
    backdrop: info.backdrop_path ?? info.movie_image ?? '',
    rating: String(info.rating ?? ''),
    genre: info.genre ?? '',
  }
}
