const TILE_BASE =
  'min-h-[220px] p-7 border-2 bg-linear-to-b from-tile-top to-panel text-[32px] text-left cursor-pointer'

const ITEM_BASE = 'py-[18px] px-5 text-[26px] border-l-4'

/** Classes Tailwind 10-foot. Literais inteiras pro scanner do CLI. */
export function tileClass(selected) {
  if (selected) {
    return `${TILE_BASE} border-brass text-phosphor shadow-[0_0_0_4px_rgb(224_177_90_/_0.35)]`
  }
  return `${TILE_BASE} border-line text-ink`
}

export function itemClass(selected) {
  if (selected) {
    return `${ITEM_BASE} border-phosphor bg-phosphor/8 text-phosphor`
  }
  return `${ITEM_BASE} border-transparent text-ink`
}

export function playerUrlClass() {
  return 'block mt-6 text-brass text-lg break-all'
}

export function catListClass() {
  return 'm-0 p-0 list-none'
}

export function itemListClass() {
  return 'm-0 p-0 list-none'
}

export function catItemClass() {
  return 'py-[18px] px-5 text-[26px] border-l-4 border-transparent text-mute'
}

export function playerTitleClass() {
  return 'm-0 mb-4 font-display text-[48px]'
}

export function playerNoteClass() {
  return 'm-0 text-mute text-[22px]'
}
