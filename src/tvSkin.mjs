const TILE_BASE =
  'min-h-[180px] p-7 border-2 bg-panel text-[30px] text-left cursor-pointer transition-colors'

const ITEM_BASE = 'py-3 px-5 text-[24px] border-l-4'

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
  return 'block mt-6 text-mute text-base break-all'
}

export function catListClass() {
  return 'm-0 p-0 list-none bg-panel'
}

export function itemListClass() {
  return 'm-0 p-0 list-none bg-panel'
}

export function catItemClass(selected = false) {
  if (selected) {
    return 'flex items-center justify-between gap-4 border-b border-line border-l-4 border-l-accent bg-row px-5 py-4 text-[24px] text-accent cursor-pointer'
  }
  return 'flex items-center justify-between gap-4 border-b border-line border-l-4 border-l-transparent px-5 py-4 text-[24px] text-ink cursor-pointer'
}

export function catCountClass() {
  return 'text-[22px] text-mute'
}

export function playerTitleClass() {
  return 'm-0 mb-3 text-[40px] font-semibold'
}

export function playerNoteClass() {
  return 'm-0 text-mute text-[20px]'
}

export function tabClass(active) {
  if (active) {
    return 'text-accent text-[24px] tracking-[0.06em] uppercase cursor-pointer'
  }
  return 'text-ink text-[24px] tracking-[0.06em] uppercase cursor-pointer'
}

export function actionClass() {
  return 'cursor-pointer border-0 bg-action px-6 py-3 text-[20px] text-ink'
}
