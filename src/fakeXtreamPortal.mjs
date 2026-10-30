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
    return jsonOk(tables[req.action] ?? [])
  }
}
