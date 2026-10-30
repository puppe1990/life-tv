const TILE_BASE =
  'min-h-[120px] p-4 md:min-h-[180px] md:p-7 border-2 bg-panel text-[clamp(18px,1.6vw,30px)] text-left cursor-pointer transition-colors'

const ITEM_BASE = 'py-2 px-3 md:py-3 md:px-5 text-[clamp(14px,1.1vw,24px)] border-l-4'

/** Classes Tailwind 10-foot. Literais inteiras pro scanner do CLI. */
export function tileClass(selected) {
  if (selected) {
    return `${TILE_BASE} border-accent bg-row text-accent`
  }
  return `${TILE_BASE} border-line text-ink`
}

export function itemClass(selected) {
  if (selected) {
    return `${ITEM_BASE} border-accent bg-row text-accent`
  }
  return `${ITEM_BASE} border-transparent text-ink`
}

export function playerUrlClass() {
  return 'mt-6 block break-all text-[clamp(12px,0.9vw,16px)] text-mute'
}

export function catListClass() {
  return 'm-0 p-0 list-none bg-panel'
}

export function itemListClass() {
  return 'm-0 p-0 list-none bg-panel'
}

export function catItemClass(selected = false) {
  if (selected) {
    return 'flex items-center justify-between gap-3 border-b border-line border-l-4 border-l-accent bg-row px-3 py-2 text-[clamp(14px,1.1vw,24px)] text-accent cursor-pointer md:gap-4 md:px-5 md:py-4'
  }
  return 'flex items-center justify-between gap-3 border-b border-line border-l-4 border-l-transparent px-3 py-2 text-[clamp(14px,1.1vw,24px)] text-ink cursor-pointer md:gap-4 md:px-5 md:py-4'
}

export function catCountClass() {
  return 'text-[clamp(13px,1vw,22px)] text-mute'
}

export function playerTitleClass() {
  return 'm-0 mb-3 text-[clamp(20px,2.2vw,40px)] font-semibold'
}

export function playerNoteClass() {
  return 'm-0 text-[clamp(14px,1vw,20px)] text-mute'
}

export function tabClass(active) {
  if (active) {
    return 'text-[clamp(14px,1vw,24px)] tracking-[0.06em] text-accent uppercase cursor-pointer'
  }
  return 'text-[clamp(14px,1vw,24px)] tracking-[0.06em] text-ink uppercase cursor-pointer'
}

export function actionClass() {
  return 'cursor-pointer border-0 bg-action px-4 py-2 text-[clamp(14px,1vw,20px)] text-ink md:px-6 md:py-3'
}
