import type { Connection, MarvelTitle, TitleFormat, UniverseId } from './data/catalog'

export interface MapSelectionOptions {
  universeIds: UniverseId[]
  showAll: boolean
  selectedId: string
  formats: ReadonlySet<TitleFormat>
}

/** Curated maps keep the immediate relationship endpoints of their featured titles. */
export function selectMapTitles(titles: MarvelTitle[], links: Connection[], options: MapSelectionOptions) {
  const { universeIds, showAll, selectedId, formats } = options
  const eligible = titles.filter((title) => formats.has(title.format) && (
    universeIds.includes(title.universeId)
    || (universeIds.length === 1 && title.viewUniverseIds?.includes(universeIds[0]))
  ))
  if (showAll) return eligible

  const featured = new Set(eligible.filter((title) => title.featured || title.id === selectedId).map((title) => title.id))
  const included = new Set(featured)
  for (const link of links) {
    if (link.type === 'direct-sequel') continue
    if (featured.has(link.from) || featured.has(link.to)) {
      included.add(link.from)
      included.add(link.to)
    }
  }
  return eligible.filter((title) => included.has(title.id))
}
