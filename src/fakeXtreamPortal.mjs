function jsonOk(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function readAction(url) {
  const parsed = new URL(url)
  return {
    path: parsed.pathname,
    username: parsed.searchParams.get('username'),
    password: parsed.searchParams.get('password'),
    action: parsed.searchParams.get('action'),
    streamId: parsed.searchParams.get('stream_id'),
    seriesId: parsed.searchParams.get('series_id'),
  }
}

/** Portal Xtream em memória para testes e demo. Sem HTTP real. */
export function createFakeXtreamPortal({
  username,
  password,
  login,
  liveCategories = [],
  liveStreams = [],
  vodCategories = [],
  vodStreams = [],
  seriesCategories = [],
  series = [],
  shortEpg = {},
  seriesInfo = {},
  m3uText = '',
}) {
  const tables = {
    get_live_categories: liveCategories,
    get_live_streams: liveStreams,
    get_vod_categories: vodCategories,
    get_vod_streams: vodStreams,
    get_series_categories: seriesCategories,
    get_series: series,
  }
  const byId = {
    get_short_epg: (req) => shortEpg[req.streamId] ?? { epg_listings: [] },
    get_series_info: (req) => seriesInfo[req.seriesId] ?? { episodes: {} },
  }
  return async function fakeFetch(url) {
    const req = readAction(url)
    if (req.path.endsWith('/get.php') || req.path.endsWith('get.php')) {
      return new Response(m3uText, { status: 200, headers: { 'content-type': 'audio/x-mpegurl' } })
    }
    if (!req.path.endsWith('player_api.php')) {
      return new Response('not found', { status: 404 })
    }
    if (req.username !== username || req.password !== password) {
      return jsonOk({ user_info: { auth: 0, status: 'Disabled' }, server_info: {} })
    }
    if (!req.action) return jsonOk(login)
    if (byId[req.action]) return jsonOk(byId[req.action](req))
    return jsonOk(tables[req.action] ?? [])
  }
}
