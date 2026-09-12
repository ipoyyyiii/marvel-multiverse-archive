import { catalog, universes, type MarvelTitle, type UniverseId } from './data/catalog'

/** How confident the archive is in a title's chronological placement. */
export type ChronologyPlacementStatus = 'confirmed' | 'approximate' | 'disputed'

export type ChronologyGroupKind = 'year' | 'era'

export interface ChronologyEntry {
  /** Stable catalog id used by the inspector and title-node actions. */
  id: string
  title: MarvelTitle
  universeId: UniverseId
  /** Normalized year used for display and ordering. */
  chronologyYear: number
  /** Original catalog value, when the chronology is explicitly known. */
  sourceChronologyYear?: number
  /** ISO release date remains available as a deterministic tie-breaker. */
  releaseDate: string
  /** Compact label for the vertical timeline, e.g. `1943` or `c. 2001`. */
  dateLabel: string
  /** Decade label is useful for minimaps and era dividers. */
  eraLabel: string
  status: ChronologyPlacementStatus
  statusLabel: 'CONFIRMED' | 'APPROXIMATE' | 'DISPUTED'
  /** The group containing this entry. */
  groupId: string
}

export interface ChronologyGroup {
  /** Stable key made from universe and normalized chronological year. */
  id: string
  universeId: UniverseId
  /** Display year or decade label for the timeline divider. */
  label: string
  kind: ChronologyGroupKind
  startYear: number
  endYear: number
  eraLabel: string
  status: ChronologyPlacementStatus
  entries: ChronologyEntry[]
}

export interface ChronologicalOrderMap {
  groups: ChronologyGroup[]
  /** Flat list in universe order, then chronology order. */
  entries: ChronologyEntry[]
  groupsByUniverse: Record<UniverseId, ChronologyGroup[]>
  entriesByUniverse: Record<UniverseId, ChronologyEntry[]>
}

export interface ChronologicalOrderOptions {
  /** The page defaults to released titles; opt in to announced records when needed. */
  includeUnreleased?: boolean
}

const universeOrder = new Map(universes.map((universe, index) => [universe.id, index]))

const sortChronology = (a: ChronologyEntry, b: ChronologyEntry) => (
  a.chronologyYear - b.chronologyYear
  || a.releaseDate.localeCompare(b.releaseDate)
  || a.title.title.localeCompare(b.title.title)
  || a.id.localeCompare(b.id)
)

const decadeFor = (year: number) => Math.floor(year / 10) * 10

const statusFor = (title: MarvelTitle): ChronologyPlacementStatus => {
  if (title.continuityStatus === 'disputed') return 'disputed'
  if (title.chronologyYear === undefined) return 'approximate'
  return 'confirmed'
}

const statusLabelFor = (status: ChronologyPlacementStatus): ChronologyEntry['statusLabel'] => {
  if (status === 'disputed') return 'DISPUTED'
  if (status === 'approximate') return 'APPROXIMATE'
  return 'CONFIRMED'
}

const groupStatusFor = (entries: ChronologyEntry[]): ChronologyPlacementStatus => {
  if (entries.some((entry) => entry.status === 'disputed')) return 'disputed'
  if (entries.some((entry) => entry.status === 'approximate')) return 'approximate'
  return 'confirmed'
}

const emptyByUniverse = <T,>(value: () => T): Record<UniverseId, T> => Object.fromEntries(
  universes.map((universe) => [universe.id, value()]),
) as Record<UniverseId, T>

const buildEntry = (title: MarvelTitle): Omit<ChronologyEntry, 'groupId'> => {
  const status = statusFor(title)
  const chronologyYear = title.chronologyYear ?? title.year
  const eraLabel = `${decadeFor(chronologyYear)}s`
  const dateLabel = title.chronologyYear === undefined
    ? `c. ${chronologyYear}`
    : `${chronologyYear}`

  return {
    id: title.id,
    title,
    universeId: title.universeId,
    chronologyYear,
    sourceChronologyYear: title.chronologyYear,
    releaseDate: title.releaseDate,
    dateLabel,
    eraLabel,
    status,
    statusLabel: statusLabelFor(status),
  }
}

/**
 * Build the vertical chronological index used by the archive.
 *
 * The catalog only stores a year (not an episode-level date) for chronology,
 * so records without `chronologyYear` are ordered by release year and marked
 * `approximate` rather than being given a fabricated in-universe date. A
 * disputed continuity always keeps the `disputed` badge, even when a year is
 * present. Released records are included by default; callers can opt into
 * future records with `{ includeUnreleased: true }`.
 */
export const buildChronologicalOrderMap = (
  titles: readonly MarvelTitle[] = catalog,
  options: ChronologicalOrderOptions = {},
): ChronologicalOrderMap => {
  const sourceTitles = options.includeUnreleased ? [...titles] : titles.filter((title) => title.released)
  const entriesByUniverse = emptyByUniverse<ChronologyEntry[]>(() => [])

  for (const title of sourceTitles) {
    const entry = buildEntry(title)
    entriesByUniverse[title.universeId].push({ ...entry, groupId: '' })
  }

  for (const universe of universes) {
    entriesByUniverse[universe.id].sort(sortChronology)
  }

  const groupsByUniverse = emptyByUniverse<ChronologyGroup[]>(() => [])
  const allGroups: ChronologyGroup[] = []

  for (const universe of universes) {
    const grouped = new Map<number, ChronologyEntry[]>()
    for (const entry of entriesByUniverse[universe.id]) {
      const group = grouped.get(entry.chronologyYear)
      if (group) group.push(entry)
      else grouped.set(entry.chronologyYear, [entry])
    }

    const groups = [...grouped.entries()]
      .sort(([yearA], [yearB]) => yearA - yearB)
      .map(([year, groupEntries]) => {
        const groupId = `${universe.id}-chronology-${year}`
        const entries = groupEntries.map((entry) => ({ ...entry, groupId }))
        const eraLabel = `${decadeFor(year)}s`
        const status = groupStatusFor(entries)
        return {
          id: groupId,
          universeId: universe.id,
          label: `${year}`,
          kind: 'year' as const,
          startYear: year,
          endYear: year,
          eraLabel,
          status,
          entries,
        }
      })

    groupsByUniverse[universe.id] = groups
    allGroups.push(...groups)
    entriesByUniverse[universe.id] = groups.flatMap((group) => group.entries)
  }

  const entries = universes.flatMap((universe) => entriesByUniverse[universe.id])
  const groups = universes.flatMap((universe) => groupsByUniverse[universe.id])

  return { groups, entries, groupsByUniverse, entriesByUniverse }
}

export const chronologicalOrderMap = buildChronologicalOrderMap()
export const chronologicalOrderGroups = chronologicalOrderMap.groups
export const chronologicalOrderEntries = chronologicalOrderMap.entries
export const chronologicalGroupsByUniverse = chronologicalOrderMap.groupsByUniverse
export const chronologicalEntriesByUniverse = chronologicalOrderMap.entriesByUniverse

