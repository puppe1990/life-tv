/**
 * Xtream player_api login: { user_info, server_info }.
 * Proveniência: FlexTV LoginResponse / LoginModel (auth, status, exp_date).
 */
export function parseXtreamLogin(payload) {
  if (!payload || typeof payload !== 'object' || !payload.user_info) {
    throw new Error(
      `login recusado: recebido ${JSON.stringify(payload)}, esperado objeto com user_info`,
    )
  }
  const user = payload.user_info
  const auth = user.auth
  if (auth !== 1 && auth !== '1') {
    throw new Error(`login recusado: recebido auth ${auth}, esperado 1`)
  }
  const status = String(user.status ?? '')
  if (status.toLowerCase() !== 'active') {
    throw new Error(`login recusado: recebido status ${status}, esperado Active`)
  }
  const server = payload.server_info ?? {}
  return {
    username: String(user.username ?? ''),
    status: 'Active',
    expDate: Number(user.exp_date),
    maxConnections: Number(user.max_connections),
    activeCons: Number(user.active_cons),
    server: {
      host: String(server.url ?? ''),
      protocol: String(server.server_protocol ?? 'http'),
      port: Number(server.port),
    },
  }
}
