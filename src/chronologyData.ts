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

/**
 * Disney+ Complete Timeline order (June 2026) for MCU records, used as the
 * final tie-breaker when story years collide. Story years stay honest — this
 * only decides the order inside a shared year, exactly where a single year
 * cannot express Marvel's own sequence (e.g. Thor: The Dark World before
 * Iron Man 3, Ant-Man and the Wasp before Infinity War).
 */
const mcuTimelineOrder: readonly string[] = [
  'mcu-eyes-of-wakanda-2025',
  'mcu-captain-america-the-first-avenger-2011',
  'mcu-agent-carter-2013',
  'mcu-captain-marvel-2019',
  'mcu-iron-man-2008',
  'mcu-iron-man-2-2010',
  'mcu-the-incredible-hulk-2008',
  'mcu-a-funny-thing-happened-on-the-way-to-thor-s-hammer-2011',
  'mcu-thor-2011',
  'mcu-the-consultant-2011',
  'mcu-the-avengers-2012',
  'mcu-item-47-2012',
  'mcu-thor-the-dark-world-2013',
  'mcu-iron-man-3-2013',
  'mcu-all-hail-the-king-2014',
  'mcu-captain-america-the-winter-soldier-2014',
  'mcu-guardians-of-the-galaxy-2014',
  'mcu-guardians-of-the-galaxy-vol-2-2017',
  'mcu-i-am-groot-2022',
  'mcu-avengers-age-of-ultron-2015',
  'mcu-ant-man-2015',
  'mcu-captain-america-civil-war-2016',
  'mcu-black-widow-2021',
  'mcu-black-panther-2018',
  'mcu-spider-man-homecoming-2017',
  'mcu-doctor-strange-2016',
  'mcu-thor-ragnarok-2017',
  'mcu-ant-man-and-the-wasp-2018',
  'mcu-avengers-infinity-war-2018',
  'mcu-avengers-endgame-2019',
  'mcu-loki-2021',
  'mcu-wandavision-2021',
  'mcu-shang-chi-and-the-legend-of-the-ten-rings-2021',
  'mcu-the-falcon-and-the-winter-soldier-2021',
  'mcu-spider-man-far-from-home-2019',
  'mcu-eternals-2021',
  'mcu-spider-man-no-way-home-2021',
  'mcu-doctor-strange-in-the-multiverse-of-madness-2022',
  'mcu-hawkeye-2021',
  'mcu-moon-knight-2022',
  'mcu-black-panther-wakanda-forever-2022',
  'mcu-echo-2024',
  'mcu-she-hulk-attorney-at-law-2022',
  'mcu-ms-marvel-2022',
  'mcu-thor-love-and-thunder-2022',
  'mcu-ironheart-2025',
  'mcu-werewolf-by-night-2022',
  'mcu-the-guardians-of-the-galaxy-holiday-special-2022',
  'mcu-ant-man-and-the-wasp-quantumania-2023',
  'mcu-guardians-of-the-galaxy-vol-3-2023',
  'mcu-secret-invasion-2023',
  'mcu-the-marvels-2023',
  'mcu-agatha-all-along-2024',
  'mcu-daredevil-born-again-2025',
  'mcu-captain-america-brave-new-world-2025',
  'mcu-thunderbolts-2025',
  'mcu-the-fantastic-four-first-steps-2025',
  'mcu-wonder-man-2026',
  'mcu-daredevil-born-again-season-2-2026',
  'mcu-the-punisher-one-last-kill-2026',
]

const mcuTimelineRank = new Map(mcuTimelineOrder.map((id, index) => [id, index]))

const sortChronology = (a: ChronologyEntry, b: ChronologyEntry) => (
  a.chronologyYear - b.chronologyYear
  || (mcuTimelineRank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (mcuTimelineRank.get(b.id) ?? Number.MAX_SAFE_INTEGER)
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

export const chronologicalOrderMap = buildChronologicalOrderMap(catalog, { includeUnreleased: true })
export const chronologicalOrderGroups = chronologicalOrderMap.groups
export const chronologicalOrderEntries = chronologicalOrderMap.entries
export const chronologicalGroupsByUniverse = chronologicalOrderMap.groupsByUniverse
export const chronologicalEntriesByUniverse = chronologicalOrderMap.entriesByUniverse

