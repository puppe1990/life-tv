import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { flattenEpisodes } from '../src/parseSeriesInfo.mjs'
import { faker } from './factories.mjs'

beforeEach(() => {
  faker.seed(52)
})

test('achata temporadas e ordena por temporada e episódio', () => {
  const payload = {
    episodes: {
      2: [
        {
          id: faker.number.int({ min: 100, max: 999 }),
          episode_num: 1,
          container_extension: 'mkv',
        },
      ],
      1: [
        {
          id: faker.number.int({ min: 100, max: 999 }),
          episode_num: 2,
          container_extension: 'mp4',
        },
        {
          id: faker.number.int({ min: 100, max: 999 }),
          episode_num: 1,
          container_extension: 'mp4',
        },
      ],
    },
  }
  const episodes = flattenEpisodes(payload)
  assert.equal(episodes.length, 3)
  assert.deepEqual(
    episodes.map((episode) => `${episode.season}x${episode.episode}`),
    ['1x1', '1x2', '2x1'],
  )
  assert.equal(episodes[2].extension, 'mkv')
})

test('recusa payload sem mapa de episódios', () => {
  assert.throws(() => flattenEpisodes({ info: {} }), /série recusada/)
})
