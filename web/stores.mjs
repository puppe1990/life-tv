import { createPlaylistStore } from '../src/addPlaylist.mjs'
import { createFavLockStore } from '../src/favLockStore.mjs'
import { createJsonBucket } from '../src/jsonBucket.mjs'
import { redactPlaylist } from '../src/playlistSecret.mjs'
import { createResumeStore } from '../src/resumeStore.mjs'
import { localStore, tauriInvoke } from './bridge.mjs'

const playlistsBucket = createJsonBucket({ storage: localStore(), key: 'life-tv:playlists' })

/** No shell Tauri a senha sai da playlist e vai pro cofre local. */
const secretlessBucket = {
  read() {
    return playlistsBucket.read()
  },
  write(items) {
    playlistsBucket.write(tauriInvoke() ? items.map(redactPlaylist) : items)
  },
}

/** Playlists salvas; no Tauri a senha sai do registro. */
export const playlistStore = createPlaylistStore({ bucket: secretlessBucket })
/** Favoritos e travas por stream_id, persistidos. */
export const favStore = createFavLockStore({
  bucket: createJsonBucket({ storage: localStore(), key: 'life-tv:favs' }),
})
/** Posição de retomada por stream_id, persistida. */
export const resumeStore = createResumeStore({
  bucket: createJsonBucket({ storage: localStore(), key: 'life-tv:resume' }),
})
