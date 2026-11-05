export const ALL_CATEGORY_ID = 'all'
export const ALL_CATEGORY_NAME = 'Todos'

function flattenItems(categories) {
  const items = []
  const seen = new Set()
  for (const category of categories) {
    for (const item of category.items ?? []) {
      const key = String(item.id)
      if (seen.has(key)) continue
      seen.add(key)
      items.push(item)
    }
  }
  return items
}

/** Coloca a categoria Todos na frente, sem duplicar canal nem empilhar o bucket. */
export function withAllCategory(categories) {
  const list = categories ?? []
  if (list.length === 0) return []
  if (list[0]?.id === ALL_CATEGORY_ID) return list
  return [{ id: ALL_CATEGORY_ID, name: ALL_CATEGORY_NAME, items: flattenItems(list) }, ...list]
}
