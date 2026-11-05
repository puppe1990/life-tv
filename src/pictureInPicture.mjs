/**
 * PiP quando o usuário saiu do player com o vídeo ainda tocando.
 * @param {{ screen: string, playing: boolean }} input
 */
export function shouldPictureInPicture({ screen, playing }) {
  if (playing !== true && playing !== false) {
    throw new Error(`playing recusado: recebido ${playing}, esperado boolean`)
  }
  return screen !== 'player' && playing
}

/** Vídeo ativo: não está pausado nem no fim. */
export function isPlayingVideo(video) {
  if (!video) return false
  return video.paused === false && video.ended !== true
}

/**
 * Volta do PiP para o player cheio com o item que estava tocando.
 * @param {object} shell
 * @param {{ catalogKind: string, selectedItem: object }} snapshot
 */
export function restorePlayerFromPip(shell, snapshot) {
  const selectedItem = snapshot?.selectedItem
  if (!selectedItem) {
    throw new Error(`selectedItem recusado: recebido ${selectedItem}, esperado item do player`)
  }
  const catalogKind = snapshot.catalogKind
  if (!catalogKind) {
    throw new Error(
      `catalogKind recusado: recebido ${catalogKind}, esperado live, movies ou series`,
    )
  }
  return { ...shell, screen: 'player', catalogKind, selectedItem }
}
