import { Film, Tv2 } from 'lucide-react'
import { useMemo, type CSSProperties, type ReactNode } from 'react'
import {
  catalog,
  universes,
  type MarvelTitle,
  type Universe,
  type UniverseId,
} from './data/catalog'
import { releaseLogoPath } from './data/logoAssets'

export interface ReleaseOrderGroupMeta {
  /** Optional label shown in the group header. Defaults to the group id. */
  label?: string
  /** Small context line shown beside the group label. */
  subtitle?: string
  /** Stable ordering for custom non-MCU grouping metadata. */
  order?: number
  /** Accent used by the group divider and logo nodes. */
  accent?: string
}

export interface ReleaseOrderGroup {
  id: string
  label?: string
  subtitle?: string
  accent?: string
  titles: MarvelTitle[]
}

export interface ReleaseOrderProps {
  /** The single universe shown in this release-order viewport. */
  universeId?: UniverseId
  /** Optional catalog override for a filtered or locally curated archive. */
  titles?: MarvelTitle[]
  /** Optional pre-built groups. When supplied, grouping callbacks are skipped. */
  groups?: ReleaseOrderGroup[]
  /** Metadata keyed by a group id, useful for non-MCU continuity group labels. */
  groupMeta?: Record<string, ReleaseOrderGroupMeta>
  /** Override the default MCU Phase 1–6 / track grouping. */
  groupBy?: (title: MarvelTitle) => string
  /** Universe records rendered as the page-level tab selector. */
  universeOptions?: Universe[]
  universeIndex?: number
  onUniverseChange?: (universeId: UniverseId) => void
  onPreviousUniverse?: () => void
  onNextUniverse?: () => void
  /** Selected title id receives the active logo treatment. */
  selectedId?: string
  /** Individual logo node callback. */
  onSelectTitle?: (titleId: string) => void
  /** Optional logo renderer for a parent that owns a richer asset pipeline. */
  renderTitleLogo?: (title: MarvelTitle) => ReactNode
  className?: string
}

const DEFAULT_GROUP_META: Record<string, ReleaseOrderGroupMeta> = {
  'phase-1': { label: 'PHASE 1', subtitle: 'Avengers assembled', order: 1 },
  'phase-2': { label: 'PHASE 2', subtitle: 'The next evolution', order: 2 },
  'phase-3': { label: 'PHASE 3', subtitle: 'Infinity arrives', order: 3 },
  'phase-4': { label: 'PHASE 4', subtitle: 'A new saga begins', order: 4 },
  'phase-5': { label: 'PHASE 5', subtitle: 'The Multiverse Saga', order: 5 },
  'phase-6': { label: 'PHASE 6', subtitle: 'Worlds converge', order: 6 },
}

const phaseForMcuTitle = (title: MarvelTitle) => {
  // Dates keep the grouping deterministic while still including every film,
  // series, special and short in the local catalog.
  if (title.year <= 2012) return 'phase-1'
  if (title.year <= 2015) return 'phase-2'
  if (title.year <= 2019) return 'phase-3'
  if (title.year <= 2022) return 'phase-4'
  if (title.year <= 2025) return 'phase-5'
  return 'phase-6'
}

const trackGroupId = (title: MarvelTitle) => title.track || 'archive'

const getUniverse = (id: UniverseId) => universes.find((universe) => universe.id === id) || universes[0]

const belongsToUniverse = (title: MarvelTitle, universeId: UniverseId) => (
  title.universeId === universeId || Boolean(title.viewUniverseIds?.includes(universeId))
)

const formatGroupCount = (titles: MarvelTitle[]) => `${titles.length} ${titles.length === 1 ? 'TITLE' : 'TITLES'}`

const formatMeta = (title: MarvelTitle) => {
  const format = title.format === 'Film' ? <Film size={10} aria-hidden="true" /> : <Tv2 size={10} aria-hidden="true" />
  return (
    <span className="release-node-meta">
      <span>{title.year}</span>
      <i>·</i>
      <span className="release-format">{format}{title.format}</span>
      {title.seasons ? <em>S{title.seasons}</em> : null}
      {!title.released ? <em className="release-future">FUTURE</em> : null}
    </span>
  )
}

function ReleaseLogo({
  title,
  selected,
  renderTitleLogo,
}: {
  title: MarvelTitle
  selected: boolean
  renderTitleLogo?: (title: MarvelTitle) => ReactNode
}) {
  if (renderTitleLogo) {
    return <span className="release-logo-custom">{renderTitleLogo(title)}</span>
  }

  if (title.logo) {
    return <img className="release-logo-image" src={releaseLogoPath(title.logo)} alt={`${title.title} title logo`} loading="lazy" decoding="async" />
  }

  return (
    <span className={`release-logo-fallback ${selected ? 'release-logo-fallback-selected' : ''}`} aria-hidden="true">
      {title.title}
    </span>
  )
}

function ReleaseTitleNode({
  title,
  accent,
  selected,
  onSelectTitle,
  renderTitleLogo,
}: {
  title: MarvelTitle
  accent: string
  selected: boolean
  onSelectTitle?: (titleId: string) => void
  renderTitleLogo?: (title: MarvelTitle) => ReactNode
}) {
  return (
    <button
      type="button"
      className={`release-title-node ${selected ? 'release-title-node-selected' : ''} ${!title.logo ? 'release-title-node-fallback' : ''}`}
      style={{ '--release-accent': accent } as CSSProperties}
      onClick={() => onSelectTitle?.(title.id)}
      aria-label={`Open ${title.title}, ${title.year} ${title.format}`}
      aria-pressed={selected}
    >
      <span className="release-node-logo-wrap">
        <ReleaseLogo title={title} selected={selected} renderTitleLogo={renderTitleLogo} />
      </span>
      <span className="release-node-title">{title.title}</span>
      {formatMeta(title)}
    </button>
  )
}

function buildMcuGroups(titles: MarvelTitle[]) {
  const groups = new Map<string, MarvelTitle[]>()
  for (const title of titles) {
    const id = phaseForMcuTitle(title)
    if (!groups.has(id)) groups.set(id, [])
    groups.get(id)!.push(title)
  }

  // Keep every phase panel in the viewport even when a future catalog slice
  // temporarily has no title in a phase.
  return Object.keys(DEFAULT_GROUP_META).map((id) => ({
    id,
    titles: groups.get(id) || [],
  }))
}

function buildNonMcuGroups(titles: MarvelTitle[], groupBy?: (title: MarvelTitle) => string) {
  const groups = new Map<string, MarvelTitle[]>()
  for (const title of titles) {
    const id = groupBy?.(title) || trackGroupId(title)
    if (!groups.has(id)) groups.set(id, [])
    groups.get(id)!.push(title)
  }
  return [...groups.entries()].map(([id, groupedTitles]) => ({ id, titles: groupedTitles }))
}

export default function ReleaseOrder({
  universeId = 'mcu',
  titles = catalog,
  groups,
  groupMeta,
  groupBy,
  universeOptions = universes,
  universeIndex,
  onUniverseChange,
  onPreviousUniverse,
  onNextUniverse,
  selectedId,
  onSelectTitle,
  renderTitleLogo,
  className = '',
}: ReleaseOrderProps) {
  const universe = getUniverse(universeId)
  const universeList = universeOptions.length ? universeOptions : universes
  const currentIndex = universeIndex ?? Math.max(0, universeList.findIndex((item) => item.id === universeId))

  const visibleTitles = useMemo(() => titles
    .filter((title) => title.released || title.universeId === universeId)
    .filter((title) => belongsToUniverse(title, universeId))
    .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate) || a.title.localeCompare(b.title)), [titles, universeId])

  const releaseGroups = useMemo<ReleaseOrderGroup[]>(() => {
    if (groups) {
      return groups.map((group) => ({
        ...group,
        titles: [...group.titles].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate) || a.title.localeCompare(b.title)),
      }))
    }

    const built = universeId === 'mcu' ? buildMcuGroups(visibleTitles) : buildNonMcuGroups(visibleTitles, groupBy)
    return built.map((group) => ({ ...group, titles: group.titles }))
  }, [groups, groupBy, universeId, visibleTitles])

  const sortedGroups = useMemo(() => [...releaseGroups].sort((a, b) => {
    const metaA = groupMeta?.[a.id] || DEFAULT_GROUP_META[a.id]
    const metaB = groupMeta?.[b.id] || DEFAULT_GROUP_META[b.id]
    return (metaA?.order ?? 999) - (metaB?.order ?? 999) || a.id.localeCompare(b.id)
  }), [groupMeta, releaseGroups])
  // The phase board reads as two independent stacks. Keeping each stack
  // separate avoids CSS grid rows inheriting the height of a much taller
  // phase, which was creating large empty gaps between MCU panels.
  const groupColumns = useMemo(() => {
    const columns: ReleaseOrderGroup[][] = [[], []]
    sortedGroups.forEach((group, index) => columns[index % 2].push(group))
    return columns.filter((column) => column.length)
  }, [sortedGroups])

  return (
    <section
      className={`release-order ${className}`.trim()}
      style={{ '--release-accent': universe.color } as CSSProperties}
      data-universe={universe.id}
      aria-label={`${universe.name} release order`}
    >
      <header className="release-header">
        <div className="release-heading">
          <span className="release-kicker">RELEASE ORDER · ONE UNIVERSE VIEW</span>
          <h1>{universe.shortName}</h1>
          <p>{universe.description}</p>
        </div>
        <div className="release-header-index">
          <span>UNIVERSE</span>
          <b>{String(currentIndex + 1).padStart(2, '0')} <i>/</i> {String(universeList.length).padStart(2, '0')}</b>
          <small>{sortedGroups.reduce((total, group) => total + group.titles.length, 0)} RELEASED TITLES</small>
        </div>
      </header>

      <nav className="release-universe-tabs" aria-label="Select universe">
        {universeList.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`release-universe-tab ${option.id === universe.id ? 'active' : ''}`}
            style={{ '--universe-tab-accent': option.color } as CSSProperties}
            onClick={() => onUniverseChange?.(option.id)}
            aria-current={option.id === universe.id ? 'page' : undefined}
          >
            {option.shortName}
          </button>
        ))}
      </nav>

      <div className="release-universe-rule" aria-hidden="true"><span /><i /><span /></div>

      <div className="release-groups" data-group-count={sortedGroups.length} data-column-count={groupColumns.length}>
        {groupColumns.map((column, columnIndex) => (
          <div className="release-group-column" key={`release-column-${columnIndex}`}>
            {column.map((group) => {
              const meta = { ...(DEFAULT_GROUP_META[group.id] || {}), ...(groupMeta?.[group.id] || {}), ...group }
              const accent = meta.accent || universe.color
              return (
                <section key={group.id} className="release-group" style={{ '--release-group-accent': accent } as CSSProperties}>
                  <header className="release-group-header">
                    <div>
                      <span className="release-group-label">{meta.label || group.id.replaceAll('-', ' ').toUpperCase()}</span>
                      {meta.subtitle ? <small>{meta.subtitle}</small> : null}
                    </div>
                    <b>{formatGroupCount(group.titles)}</b>
                  </header>
                  <div className="release-group-rule" aria-hidden="true" />
                  <div className="release-title-grid">
                    {group.titles.map((title) => (
                      <ReleaseTitleNode
                        key={title.id}
                        title={title}
                        accent={accent}
                        selected={title.id === selectedId}
                        onSelectTitle={onSelectTitle}
                        renderTitleLogo={renderTitleLogo}
                      />
                    ))}
                    {!group.titles.length ? <p className="release-group-empty">No released titles in this phase yet.</p> : null}
                  </div>
                </section>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}

export { ReleaseTitleNode }
