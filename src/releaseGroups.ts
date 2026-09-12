import { catalog, type MarvelTitle, type UniverseId, universes } from './data/catalog'

export type ReleaseGroupKind = 'mcu-phase' | 'era' | 'cycle'

export interface ReleaseGroup {
  /** Stable key for filters and deep links. */
  id: string
  /** Human-readable label, including the continuity or phase name. */
  label: string
  kind: ReleaseGroupKind
  universeId: UniverseId
  /** Inclusive display range for the group, independent of individual title dates. */
  startYear: number
  endYear: number
  /** Every title remains an individual record in release-date order. */
  titles: MarvelTitle[]
}

export interface ReleaseOrderEntry {
  index: number
  title: MarvelTitle
  groupId: string
}

export interface ReleaseOrderMap {
  groups: ReleaseGroup[]
  entries: ReleaseOrderEntry[]
}

export interface ReleaseGroupSpec {
  id: string
  label: string
  kind: ReleaseGroupKind
  universeId: UniverseId
  startYear?: number
  endYear?: number
}

const phaseSpecs: ReleaseGroupSpec[] = [
  { id: 'mcu-phase-1', label: 'MCU · Phase 1', kind: 'mcu-phase', universeId: 'mcu', startYear: 2008, endYear: 2012 },
  { id: 'mcu-phase-2', label: 'MCU · Phase 2', kind: 'mcu-phase', universeId: 'mcu', startYear: 2013, endYear: 2015 },
  { id: 'mcu-phase-3', label: 'MCU · Phase 3', kind: 'mcu-phase', universeId: 'mcu', startYear: 2016, endYear: 2019 },
  { id: 'mcu-phase-4', label: 'MCU · Phase 4', kind: 'mcu-phase', universeId: 'mcu', startYear: 2021, endYear: 2022 },
  { id: 'mcu-phase-5', label: 'MCU · Phase 5', kind: 'mcu-phase', universeId: 'mcu', startYear: 2023, endYear: 2025 },
  { id: 'mcu-phase-6', label: 'MCU · Phase 6', kind: 'mcu-phase', universeId: 'mcu', startYear: 2025, endYear: 2027 },
]

const nonMcuSpecs: Record<string, ReleaseGroupSpec> = {
  'fox:fox-original': { id: 'fox-original-cycle', label: 'Fox X-Men · Original Cycle', kind: 'cycle', universeId: 'fox', startYear: 2000, endYear: 2006 },
  'fox:fox-wolverine-origin': { id: 'fox-wolverine-cycle', label: 'Fox X-Men · Wolverine Origins Cycle', kind: 'cycle', universeId: 'fox', startYear: 2009, endYear: 2009 },
  'fox:fox-revised': { id: 'fox-revised-cycle', label: 'Fox X-Men · Revised Timeline Cycle', kind: 'cycle', universeId: 'fox', startYear: 2011, endYear: 2019 },
  'fox:fox-deadpool': { id: 'fox-deadpool-cycle', label: 'Fox X-Men · Deadpool Cycle', kind: 'cycle', universeId: 'fox', startYear: 2016, endYear: 2018 },
  'fox:fox-logan-future': { id: 'fox-logan-future', label: 'Fox X-Men · Logan Future', kind: 'era', universeId: 'fox', startYear: 2017, endYear: 2017 },
  'fox:fox-new-mutants': { id: 'fox-new-mutants', label: 'Fox X-Men · New Mutants', kind: 'era', universeId: 'fox', startYear: 2020, endYear: 2020 },
  'raimi:raimi-trilogy': { id: 'raimi-trilogy', label: 'Raimi Spider-Man · Trilogy', kind: 'cycle', universeId: 'raimi', startYear: 2002, endYear: 2007 },
  'amazing:amazing-duology': { id: 'amazing-duology', label: 'Amazing Spider-Man · Duology', kind: 'cycle', universeId: 'amazing', startYear: 2012, endYear: 2014 },
  'sony:venom-series': { id: 'sony-venom-cycle', label: 'Sony Spider-Man · Venom Cycle', kind: 'cycle', universeId: 'sony', startYear: 2018, endYear: 2024 },
  'sony:sony-morbius': { id: 'sony-morbius-cycle', label: 'Sony Spider-Man · Morbius Cycle', kind: 'cycle', universeId: 'sony', startYear: 2022, endYear: 2022 },
  'sony:sony-madame-web': { id: 'sony-madame-web-cycle', label: 'Sony Spider-Man · Madame Web Cycle', kind: 'cycle', universeId: 'sony', startYear: 2024, endYear: 2024 },
  'sony:sony-kraven': { id: 'sony-kraven-cycle', label: 'Sony Spider-Man · Kraven Cycle', kind: 'cycle', universeId: 'sony', startYear: 2024, endYear: 2024 },
  'sony:sony-noir': { id: 'sony-noir-cycle', label: 'Sony Spider-Man · Noir Cycle', kind: 'cycle', universeId: 'sony', startYear: 2026, endYear: 2026 },
  'marvel-tv:marvel-tv-mutant-x': { id: 'marvel-tv-mutant-x-era', label: 'Marvel Television · Mutant X Era', kind: 'era', universeId: 'marvel-tv', startYear: 2001, endYear: 2003 },
  'marvel-tv:marvel-tv-shield': { id: 'marvel-tv-shield-cycle', label: 'Marvel Television · S.H.I.E.L.D. Cycle', kind: 'cycle', universeId: 'marvel-tv', startYear: 2013, endYear: 2016 },
  'marvel-tv:marvel-tv-agent-carter': { id: 'marvel-tv-agent-carter-cycle', label: 'Marvel Television · Agent Carter Cycle', kind: 'cycle', universeId: 'marvel-tv', startYear: 2015, endYear: 2015 },
  'marvel-tv:marvel-tv-fox': { id: 'marvel-tv-fox-mutant-era', label: 'Marvel Television · FX Mutant Era', kind: 'era', universeId: 'marvel-tv', startYear: 2017, endYear: 2017 },
  'marvel-tv:marvel-tv-inhumans': { id: 'marvel-tv-inhumans-cycle', label: 'Marvel Television · Inhumans Cycle', kind: 'cycle', universeId: 'marvel-tv', startYear: 2017, endYear: 2017 },
  'marvel-tv:marvel-tv-young': { id: 'marvel-tv-young-heroes-cycle', label: 'Marvel Television · Young Heroes Cycle', kind: 'cycle', universeId: 'marvel-tv', startYear: 2017, endYear: 2018 },
  'marvel-tv:marvel-tv-helstrom': { id: 'marvel-tv-helstrom-cycle', label: 'Marvel Television · Helstrom Cycle', kind: 'cycle', universeId: 'marvel-tv', startYear: 2020, endYear: 2020 },
  'defenders:defenders-saga': { id: 'defenders-saga', label: 'Defenders Saga · Street-Level Cycle', kind: 'cycle', universeId: 'defenders', startYear: 2015, endYear: 2019 },
  'alternate:what-if': { id: 'alternate-what-if', label: 'Alternate Realities · What If...? Cycle', kind: 'cycle', universeId: 'alternate', startYear: 2021, endYear: 2025 },
  'alternate:friendly-spider': { id: 'alternate-friendly-spider', label: 'Alternate Realities · Friendly Neighborhood Cycle', kind: 'cycle', universeId: 'alternate', startYear: 2025, endYear: 2025 },
  'alternate:marvel-zombies': { id: 'alternate-marvel-zombies', label: 'Alternate Realities · Marvel Zombies Cycle', kind: 'cycle', universeId: 'alternate', startYear: 2025, endYear: 2025 },
}

const continuitySpecs: Record<string, ReleaseGroupSpec> = {
  'legacy:Captain America serial continuity': { id: 'legacy-captain-america-serial', label: 'Legacy Marvel · Captain America Serial', kind: 'cycle', universeId: 'legacy' },
  'legacy:Incredible Hulk television continuity': { id: 'legacy-incredible-hulk-tv', label: 'Legacy Marvel · Incredible Hulk Television', kind: 'cycle', universeId: 'legacy' },
  'legacy:Independent television films': { id: 'legacy-independent-tv-films', label: 'Legacy Marvel · Independent Television Films', kind: 'era', universeId: 'legacy' },
  'legacy:Standalone legacy films': { id: 'legacy-standalone-films', label: 'Legacy Marvel · Standalone Films', kind: 'era', universeId: 'legacy' },
  'legacy:Blade trilogy': { id: 'legacy-blade-cycle', label: 'Legacy Marvel · Blade Cycle', kind: 'cycle', universeId: 'legacy' },
  'legacy:Daredevil / Elektra continuity': { id: 'legacy-daredevil-elektra', label: 'Legacy Marvel · Daredevil / Elektra Cycle', kind: 'cycle', universeId: 'legacy' },
  'legacy:Fantastic Four film continuity': { id: 'legacy-fantastic-four-cycle', label: 'Legacy Marvel · Fantastic Four Cycle', kind: 'cycle', universeId: 'legacy' },
  'legacy:Fantastic Four reboot continuity': { id: 'legacy-fantastic-four-reboot', label: 'Legacy Marvel · Fantastic Four Reboot', kind: 'cycle', universeId: 'legacy' },
  'legacy:Ghost Rider films': { id: 'legacy-ghost-rider-cycle', label: 'Legacy Marvel · Ghost Rider Cycle', kind: 'cycle', universeId: 'legacy' },
  'legacy:Punisher films': { id: 'legacy-punisher-cycle', label: 'Legacy Marvel · Punisher Cycle', kind: 'cycle', universeId: 'legacy' },
}

const animationSpecs: Record<string, ReleaseGroupSpec> = {
  'Classic Marvel animation': { id: 'animation-classic-era', label: 'Marvel Animation · Classic Era', kind: 'era', universeId: 'animation' },
  '1990s animated continuities': { id: 'animation-1990s-era', label: 'Marvel Animation · 1990s Era', kind: 'era', universeId: 'animation' },
  'Modern animated series': { id: 'animation-modern-era', label: 'Marvel Animation · Modern Era', kind: 'era', universeId: 'animation' },
  'Marvel Anime': { id: 'animation-anime-cycle', label: 'Marvel Animation · Anime Cycle', kind: 'cycle', universeId: 'animation' },
  'Animated features and specials': { id: 'animation-features-specials', label: 'Marvel Animation · Features & Specials', kind: 'era', universeId: 'animation' },
  'Spider-Verse films': { id: 'spider-verse-film-cycle', label: 'Spider-Verse · Film Cycle', kind: 'cycle', universeId: 'animation' },
  'Marvel Rising universe': { id: 'marvel-rising-cycle', label: 'Marvel Rising · Film & Special Cycle', kind: 'cycle', universeId: 'animation' },
}

const sortByReleaseDate = (a: MarvelTitle, b: MarvelTitle) => {
  const dateOrder = a.releaseDate.localeCompare(b.releaseDate)
  return dateOrder || a.id.localeCompare(b.id)
}

const universeName = (universeId: UniverseId) => universes.find((universe) => universe.id === universeId)?.name ?? universeId

const fallbackSpec = (title: MarvelTitle): ReleaseGroupSpec => ({
  id: `${title.universeId}-${title.continuity.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  label: `${universeName(title.universeId)} · ${title.continuity}`,
  kind: 'era',
  universeId: title.universeId,
})

/** Resolve the release-order bucket for one catalog record. */
export const getReleaseGroupSpec = (title: MarvelTitle): ReleaseGroupSpec => {
  if (title.universeId === 'mcu') {
    // Phase 6 starts with The Fantastic Four: First Steps in 2025. The
    // remaining 2025 releases in this catalog belong to Phase 5, so the
    // year boundary alone is intentionally not used for that overlap.
    const phase = title.title === 'The Fantastic Four: First Steps' || title.year >= 2026
      ? phaseSpecs.find((spec) => spec.id === 'mcu-phase-6')
      : phaseSpecs.find((spec) => {
      if (spec.id === 'mcu-phase-6') return title.year >= 2025
      return title.year >= (spec.startYear ?? title.year) && title.year <= (spec.endYear ?? title.year)
      })
    return phase ?? phaseSpecs[phaseSpecs.length - 1]
  }

  if (title.universeId === 'animation') return animationSpecs[title.continuity] ?? fallbackSpec(title)
  if (title.universeId === 'legacy') return continuitySpecs[`${title.universeId}:${title.continuity}`] ?? fallbackSpec(title)
  return nonMcuSpecs[`${title.universeId}:${title.track}`] ?? fallbackSpec(title)
}

const rangeFor = (spec: ReleaseGroupSpec, titles: MarvelTitle[]): [number, number] => {
  const actualYears = titles.map((title) => title.year)
  const actualStart = Math.min(...actualYears)
  const actualEnd = Math.max(...actualYears)
  return [
    Math.min(spec.startYear ?? actualStart, actualStart),
    Math.max(spec.endYear ?? actualEnd, actualEnd),
  ]
}

/**
 * Build the release-order index used by the archive. Announced records are
 * excluded, while each released title remains a separate entry and is sorted
 * by its exact ISO release date within both the flat list and its group.
 */
export const buildReleaseOrderMap = (titles: readonly MarvelTitle[] = catalog): ReleaseOrderMap => {
  const releasedTitles = titles.filter((title) => title.released).sort(sortByReleaseDate)
  const grouped = new Map<string, { spec: ReleaseGroupSpec; titles: MarvelTitle[] }>()

  for (const title of releasedTitles) {
    const spec = getReleaseGroupSpec(title)
    const current = grouped.get(spec.id)
    if (current) current.titles.push(title)
    else grouped.set(spec.id, { spec, titles: [title] })
  }

  const groups = [...grouped.values()]
    .map(({ spec, titles: groupTitles }) => {
      const [startYear, endYear] = rangeFor(spec, groupTitles)
      return {
        id: spec.id,
        label: spec.label,
        kind: spec.kind,
        universeId: spec.universeId,
        startYear,
        endYear,
        titles: groupTitles,
      }
    })
    .sort((a, b) => sortByReleaseDate(a.titles[0], b.titles[0]) || a.id.localeCompare(b.id))

  const groupIds = new Map(groups.map((group) => [group.id, group.id]))
  const entries = releasedTitles.map((title, index) => {
    const groupId = getReleaseGroupSpec(title).id
    if (!groupIds.has(groupId)) throw new Error(`Release group missing from map: ${groupId}`)
    return { index, title, groupId }
  })

  return { groups, entries }
}

export const releaseOrderMap = buildReleaseOrderMap()
export const releaseOrderGroups = releaseOrderMap.groups
export const releaseOrderEntries = releaseOrderMap.entries
