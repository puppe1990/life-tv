function mapItem(stream) {
  const item = {
    id: stream.stream_id ?? stream.series_id,
    name: stream.name,
    icon: stream.stream_icon ?? stream.cover ?? '',
    categoryId: String(stream.category_id),
  }
  if (stream.container_extension) item.extension = stream.container_extension
  return item
}

/** Agrupa get_live/vod/series_streams nas categorias Xtream. */
export function mapCatalog({ kind, categories, streams }) {
  const buckets = (categories ?? []).map((cat) => ({
    id: String(cat.category_id),
    name: cat.category_name,
    items: [],
  }))
  const byId = new Map(buckets.map((bucket) => [bucket.id, bucket]))
  for (const stream of streams ?? []) {
    const bucket = byId.get(String(stream.category_id))
    if (bucket) bucket.items.push(mapItem(stream))
  }
  return { kind, categories: buckets.filter((bucket) => bucket.items.length > 0) }
}
