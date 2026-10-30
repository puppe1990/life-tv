/** Filtra categorias pelo nome do item, preservando o índice original. */
export function filterCategories(categories, term) {
  const needle = String(term ?? '')
    .trim()
    .toLowerCase()
  const indexed = (categories ?? []).map((category, index) => ({ ...category, sourceIndex: index }))
  if (needle === '') return indexed
  return indexed
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.name.toLowerCase().includes(needle)),
    }))
    .filter((category) => category.items.length > 0)
}
