import { createFakeXtreamPortal } from './fakeXtreamPortal.mjs'

export const DEMO_PLAYLIST = {
  kind: 'xc',
  name: 'Demo local',
  portal: 'http://demo.life-tv.test:8080',
  username: 'demo',
  password: 'demo',
}

const DEMO_LOGIN = {
  user_info: {
    username: 'demo',
    password: 'demo',
    auth: 1,
    status: 'Active',
    exp_date: '2000000000',
    max_connections: '1',
    active_cons: '0',
  },
  server_info: {
    url: 'demo.life-tv.test',
    port: '8080',
    server_protocol: 'http',
  },
}

/** Catálogo de demonstração. Sem rede; URLs não apontam pra stream real. */
export function createDemoFetch() {
  return createFakeXtreamPortal({
    username: DEMO_PLAYLIST.username,
    password: DEMO_PLAYLIST.password,
    login: DEMO_LOGIN,
    liveCategories: [
      { category_id: '1', category_name: 'Notícias', parent_id: 0 },
      { category_id: '2', category_name: 'Esporte', parent_id: 0 },
    ],
    liveStreams: [
      {
        stream_id: 101,
        name: 'TV Cultura',
        category_id: '1',
        stream_icon: '',
        stream_type: 'live',
      },
      {
        stream_id: 102,
        name: 'Canal Saúde',
        category_id: '1',
        stream_icon: '',
        stream_type: 'live',
      },
      {
        stream_id: 201,
        name: 'Esporte Aberto',
        category_id: '2',
        stream_icon: '',
        stream_type: 'live',
      },
    ],
    vodCategories: [{ category_id: '3', category_name: 'Cinema', parent_id: 0 }],
    vodStreams: [
      {
        stream_id: 301,
        name: 'O Demônio e a Srta. Prym',
        category_id: '3',
        container_extension: 'mp4',
        stream_icon: '',
        stream_type: 'movie',
      },
    ],
    seriesCategories: [{ category_id: '4', category_name: 'Drama', parent_id: 0 }],
    series: [{ series_id: 401, name: 'Capitães da Areia', category_id: '4', cover: '' }],
  })
}
