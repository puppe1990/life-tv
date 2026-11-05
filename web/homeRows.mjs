import { channelMark } from '../src/channelMark.mjs'
import { liveBadgeClass } from '../src/tvSkin.mjs'
import { el } from './dom.mjs'

function poster(card) {
  const art = el('div', 'relative aspect-video bg-well bg-cover bg-center')
  if (card.icon) art.style.backgroundImage = `url("${card.icon}")`
  else {
    art.append(
      el(
        'div',
        'absolute inset-0 flex items-center justify-center font-display text-[40px] font-black text-accent/80',
        channelMark(card.name),
      ),
    )
  }
  art.append(el('div', 'absolute inset-0 bg-linear-to-t from-panel to-black/30'))
  if (card.catalogKind === 'live') {
    const badge = el('div', 'absolute top-3 left-3')
    badge.append(el('span', liveBadgeClass(), 'Ao vivo'))
    art.append(badge)
  }
  return art
}

function homeCard(card, kind, onOpen) {
  const button = el(
    'button',
    'group w-[240px] shrink-0 overflow-hidden rounded-lg bg-panel text-left cursor-pointer md:w-[280px]',
  )
  button.type = 'button'
  button.dataset.homeCard = kind
  button.dataset.streamId = card.streamId
  button.append(poster(card))
  const body = el('div', 'grid gap-1 p-4')
  body.append(el('h3', 'm-0 truncate font-display text-[18px] font-bold text-ink', card.name))
  button.append(body)
  button.addEventListener('click', () => onOpen(card))
  return button
}

function homeRow(title, cards, kind, onOpen) {
  const section = el('section', 'grid gap-4')
  section.append(
    el(
      'h2',
      'm-0 font-display text-[clamp(22px,2vw,32px)] font-bold tracking-tight text-ink',
      title,
    ),
  )
  const row = el('div', 'flex gap-4 overflow-x-auto pb-1')
  row.append(...cards.map((card) => homeCard(card, kind, onOpen)))
  section.append(row)
  return section
}

/** Fileiras da home: Continuar assistindo e Favoritos. */
export function renderHomeRows({ history = [], favs = [], onOpen }) {
  const nodes = []
  if (history.length) nodes.push(homeRow('Continuar assistindo', history, 'history', onOpen))
  if (favs.length) nodes.push(homeRow('Favoritos', favs, 'fav', onOpen))
  return nodes
}
