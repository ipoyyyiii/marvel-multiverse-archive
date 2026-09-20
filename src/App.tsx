import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpenText,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Film,
  Layers3,
  ListFilter,
  Menu,
  PanelRightOpen,
  Search,
  Sparkles,
  Tv2,
  X,
  ZoomIn,
} from 'lucide-react'
import {
  catalog,
  catalogStats,
  connections,
  selectedDefaultId,
  universes,
  type Connection,
  type ConnectionType,
  type MarvelTitle,
  type TitleFormat,
  type Universe,
  type UniverseId,
} from './data/catalog'
import ReleaseOrder from './ReleaseOrder'
import { releaseOrderGroups } from './releaseGroups'
import ChronologicalOrder, { chronologyDateLabel } from './ChronologicalOrder'
import { chronologicalEntriesByUniverse } from './chronologyData'
import MultiverseMap from './MultiverseMap'
import { archiveLogoPath } from './data/logoAssets'
import { timelineColor } from './TimelineEnergy'

type UniverseFilter = UniverseId | 'all'
type ConnectionDisplay = 'selected' | 'events' | 'all' | 'off'
type ArchiveMode = 'map' | 'release' | 'chronological'

const ARCHIVE_MODE_ORDER: ArchiveMode[] = ['map', 'release', 'chronological']

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})

const formatDate = (date: string) => {
  if (date.length === 4) return `${date} · exact day unavailable`
  return DATE_FORMATTER.format(new Date(`${date}T00:00:00Z`))
}

const getUniverse = (id: UniverseId) => universes.find((universe) => universe.id === id)!

/** Chronological view only lists single-continuity film universes. TV,
 *  animation, and alternate buckets mix unrelated continuities, so a shared
 *  "chronology" there would be fiction. Nothing else uses this list. */
const CHRONOLOGICAL_UNIVERSES: Universe[] = universes.filter((universe) =>
  ['mcu', 'fox', 'raimi', 'amazing', 'sony'].includes(universe.id),
)

const belongsToUniverseView = (title: MarvelTitle, universeId: UniverseId) => (
  title.universeId === universeId || Boolean(title.viewUniverseIds?.includes(universeId))
)

const connectionLabel: Record<ConnectionType, string> = {
  'direct-sequel': 'Direct sequel',
  crossover: 'Crossover',
  multiverse: 'Multiverse',
  'time-travel': 'Time travel',
  'timeline-reset': 'Timeline reset',
}

const connectedTo = (titleId: string) => connections.filter((connection) => (
  connection.from === titleId || connection.to === titleId
))

const characterKeywords = (title: MarvelTitle) => {
  const name = title.title.toLowerCase()
  const terms: string[] = []
  if (name.includes('spider-man') || name.includes('spider-verse')) terms.push('peter parker', 'miles morales', 'spider-man')
  if (name.includes('venom')) terms.push('eddie brock', 'symbiote')
  if (name.includes('iron man') || name.includes('avengers')) terms.push('tony stark', 'iron man', 'avengers')
  if (name.includes('captain america')) terms.push('steve rogers', 'sam wilson', 'captain america')
  if (name.includes('thor')) terms.push('thor odinson', 'loki')
  if (name.includes('daredevil')) terms.push('matt murdock', 'kingpin', 'wilson fisk')
  if (name.includes('x-men') || name.includes('wolverine') || name.includes('logan')) terms.push('x-men', 'wolverine', 'logan', 'mutants')
  if (name.includes('deadpool')) terms.push('wade wilson', 'deadpool')
  if (name.includes('black panther') || name.includes('wakanda')) terms.push('tchalla', 'shuri', 'wakanda')
  if (name.includes('captain marvel') || name.includes('marvels')) terms.push('carol danvers', 'kamala khan', 'monica rambeau')
  if (name.includes('fantastic four')) terms.push('reed richards', 'sue storm', 'johnny storm', 'ben grimm')
  return terms.join(' ')
}

const isCrossUniverse = (connection: Connection) => {
  const from = catalog.find((title) => title.id === connection.from)
  const to = catalog.find((title) => title.id === connection.to)
  return Boolean(from && to && from.universeId !== to.universeId)
}

function TopNavigation({
  query,
  setQuery,
  onSelect,
  archiveMode,
  onModeChange,
  sidebarOpen,
  onToggleSidebar,
}: {
  query: string
  setQuery: (query: string) => void
  onSelect: (id: string) => void
  archiveMode: ArchiveMode
  onModeChange: (mode: ArchiveMode) => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
}) {
  const [searchFocused, setSearchFocused] = useState(false)
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []
    return catalog
      .filter((title) => `${title.title} ${title.year} ${getUniverse(title.universeId).name} ${characterKeywords(title)}`.toLowerCase().includes(normalized))
      .slice(0, 7)
  }, [query])

  return (
    <header className="top-nav">
      <div className="brand-lockup" aria-label="Marvel Multiverse Archive">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          aria-expanded={sidebarOpen}
          aria-label={`${sidebarOpen ? 'Close' : 'Open'} universe sidebar`}
          title={`${sidebarOpen ? 'Close' : 'Open'} universe sidebar`}
        >
          <Menu size={17} strokeWidth={2.2} />
        </button>
        <span className="marvel-mark">MARVEL</span>
        <span className="brand-divider" />
        <span className="archive-name">MULTIVERSE <b>ARCHIVE</b></span>
      </div>

      <nav className="archive-mode-nav" aria-label="Archive views">
        <button
          type="button"
          className={`archive-mode-button ${archiveMode === 'map' ? 'active' : ''}`}
          aria-current={archiveMode === 'map' ? 'page' : undefined}
          onClick={() => onModeChange('map')}
        >
          Multiverse Map
        </button>
        <button
          type="button"
          className={`archive-mode-button ${archiveMode === 'release' ? 'active' : ''}`}
          aria-current={archiveMode === 'release' ? 'page' : undefined}
          onClick={() => onModeChange('release')}
        >
          By Release Order
        </button>
        <button
          type="button"
          className={`archive-mode-button ${archiveMode === 'chronological' ? 'active' : ''}`}
          aria-current={archiveMode === 'chronological' ? 'page' : undefined}
          onClick={() => onModeChange('chronological')}
        >
          By Chronological Order
        </button>
      </nav>

      <div className="nav-actions">
        <div className={`global-search ${searchFocused ? 'focused' : ''}`}>
          <Search size={16} />
          <input
            id="archive-search"
            name="archive-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 160)}
            placeholder="Search movies, series, characters..."
            aria-label="Search the complete catalog"
          />
          {query && <button className="icon-button clear-search" onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}
          {searchFocused && query && (
            <div className="search-results">
              <div className="search-results-head">
                <span>COMPLETE ARCHIVE</span><b>{results.length ? `${results.length} BEST MATCHES` : 'NO MATCHES'}</b>
              </div>
              {results.map((title) => (
                <button key={title.id} onClick={() => { onSelect(title.id); setQuery('') }}>
                  <span className="search-result-mark" style={{ '--accent': getUniverse(title.universeId).color } as React.CSSProperties}>
                    {title.logo ? <img src={archiveLogoPath(title.logo)} alt="" loading="lazy" decoding="async" /> : title.title.slice(0, 1)}
                  </span>
                  <span><b>{title.title}</b><small>{title.year} · {title.format} · {getUniverse(title.universeId).name}</small></span>
                  {!title.released && <em>ANNOUNCED</em>}
                </button>
              ))}
              <div className="search-results-foot">Search covers all {catalog.length} archive records</div>
            </div>
          )}
        </div>
        <div className="archive-count" title="Complete released catalog in the selected archive scope">
          <Layers3 size={14} />
          <span><b>{catalogStats.released}</b><small>RELEASED TITLES</small></span>
        </div>
      </div>
    </header>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button className={`toggle-control ${checked ? 'on' : ''}`} onClick={onChange} aria-pressed={checked}>
      <span className="toggle-track"><span /></span>{label}
    </button>
  )
}

/** Mobile-only (<768px) viewport flag. The collapsible explore header
 *  renders a disclosure <button> on phones; desktop keeps the original
 *  static header markup so its visuals never change. */
function useIsMobileToolbar() {
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  ))
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    }
    return undefined
  }, [])
  return isMobile
}

function ExploreToolbar({
  connectionDisplay,
  setConnectionDisplay,
  showAll,
  setShowAll,
  focus,
  setFocus,
  roadToDoomsday,
  setRoadToDoomsday,
  expanded,
  onToggleExpanded,
  collapsible,
}: {
  connectionDisplay: ConnectionDisplay
  setConnectionDisplay: (value: ConnectionDisplay) => void
  showAll: boolean
  setShowAll: (value: boolean) => void
  focus: boolean
  setFocus: (value: boolean) => void
  roadToDoomsday: boolean
  setRoadToDoomsday: (value: boolean) => void
  expanded: boolean
  onToggleExpanded: () => void
  collapsible: boolean
}) {
  // Desktop keeps the original static header and flat controls markup, so
  // its visuals never change. The disclosure <button> + collapsing
  // .view-controls wrapper only render on mobile (collapsible below 768px).
  const controls = (
    <>
      <div className="map-mode-badge" aria-label="Relationship map mode">RELATIONSHIP MAP <span>NO DATE SCALE</span></div>
      <div className="toolbar-toggles">
        <label className="connection-mode">
          <span>CONNECTIONS</span>
          <select id="connection-display" name="connection-display" value={connectionDisplay} onChange={(event) => setConnectionDisplay(event.target.value as ConnectionDisplay)}>
            <option value="selected">Selected title</option>
            <option value="events">Crossover events</option>
            <option value="all">All connections</option>
            <option value="off">Hidden</option>
          </select>
        </label>
        <Toggle checked={showAll} onChange={() => setShowAll(!showAll)} label="Show All Titles" />
        <Toggle checked={focus} onChange={() => setFocus(!focus)} label="Focus on Selected Universe" />
        <Toggle checked={roadToDoomsday} onChange={() => setRoadToDoomsday(!roadToDoomsday)} label="Road to Doomsday" />
      </div>
    </>
  )
  return (
    <section className={`explore-toolbar${collapsible ? ' toolbar-collapsible' : ''}${collapsible && !expanded ? ' toolbar-collapsed' : ''}`}>
      {collapsible ? (
        <button
          type="button"
          className="explore-title-toggle"
          aria-expanded={expanded}
          aria-controls="explore-view-controls"
          onClick={onToggleExpanded}
        >
          <span className="explore-toggle-text">
            <span className="eyebrow"><Sparkles size={12} /> COMPLETE SCREEN ARCHIVE</span>
            <span className="explore-toggle-heading">Explore the Marvel Multiverse</span>
            <span className="explore-toggle-sub">Separate worlds. Connected stories.</span>
          </span>
          {!expanded && <span className="explore-collapsed-badge">RELATIONSHIP MAP</span>}
          <span className="explore-toggle-chevron" aria-hidden="true">
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>
        </button>
      ) : (
        <div className="explore-title">
          <span className="eyebrow"><Sparkles size={12} /> COMPLETE SCREEN ARCHIVE</span>
          <h1>Explore the Marvel Multiverse</h1>
          <p>Separate worlds. Connected stories.</p>
        </div>
      )}
      {collapsible ? (
        <div className="view-controls" id="explore-view-controls" inert={!expanded}>
          <div className="view-controls-inner">
            {controls}
          </div>
        </div>
      ) : (
        <div className="view-controls">
          {controls}
        </div>
      )}
    </section>
  )
}

function Sidebar({
  open,
  activeUniverse,
  setActiveUniverse,
  hiddenUniverses,
  toggleUniverse,
  toggleAllUniverses,
  formatFilters,
  toggleFormat,
  connectionFilter,
  setConnectionFilter,
}: {
  open: boolean
  activeUniverse: UniverseFilter
  setActiveUniverse: (id: UniverseFilter) => void
  hiddenUniverses: Set<UniverseId>
  toggleUniverse: (id: UniverseId) => void
  toggleAllUniverses: () => void
  formatFilters: Set<TitleFormat>
  toggleFormat: (format: TitleFormat) => void
  connectionFilter: ConnectionType | 'all'
  setConnectionFilter: (filter: ConnectionType | 'all') => void
}) {
  const counts = useMemo(() => Object.fromEntries(universes.map((universe) => [
    universe.id, catalog.filter((title) => belongsToUniverseView(title, universe.id) && title.released).length,
  ])), [])
  const allUniversesVisible = hiddenUniverses.size === 0
  const someUniversesVisible = hiddenUniverses.size < universes.length

  return (
    <aside className="sidebar" aria-hidden={!open} inert={!open}>
      <div className="sidebar-scroll">
        <div className="sidebar-section universe-section">
          <div className="section-heading"><span>UNIVERSES</span><small>{catalogStats.universes}</small></div>
          <div className={`universe-row ${activeUniverse === 'all' ? 'active' : ''} ${!someUniversesVisible ? 'off' : ''}`}>
            <button className="universe-select all-universe-select" onClick={() => setActiveUniverse('all')}>
              <span className="all-universe-icon"><Layers3 size={14} /></span><b>All Universes</b><small>{catalogStats.released}</small>
            </button>
            <button className={`universe-switch ${allUniversesVisible ? 'on' : ''} ${someUniversesVisible && !allUniversesVisible ? 'mixed' : ''}`} style={{ '--accent': '#dce7f5' } as React.CSSProperties} onClick={toggleAllUniverses} aria-label={`${allUniversesVisible ? 'Hide' : 'Show'} all universe timelines`} aria-pressed={allUniversesVisible}>
              <span />
            </button>
          </div>
          {universes.map((universe) => (
            <div
              key={universe.id}
              data-universe={universe.id}
              style={{ '--accent': timelineColor(universe.id, universe.color) } as React.CSSProperties}
              className={`universe-row ${activeUniverse === universe.id ? 'active' : ''} ${hiddenUniverses.has(universe.id) ? 'off' : ''}`}
            >
              <button className="universe-select" onClick={() => setActiveUniverse(universe.id)}>
                <b>{universe.name}</b><small>{counts[universe.id]}</small>
              </button>
              <button className={`universe-switch ${!hiddenUniverses.has(universe.id) ? 'on' : ''}`} onClick={() => toggleUniverse(universe.id)} aria-label={`${hiddenUniverses.has(universe.id) ? 'Show' : 'Hide'} ${universe.name} timeline`} aria-pressed={!hiddenUniverses.has(universe.id)}>
                <span />
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-section filter-section">
          <div className="section-heading"><span>ARCHIVE FILTERS</span><ListFilter size={13} /></div>
          <div className="filter-label">FORMAT</div>
          <div className="filter-chips">
            {(['Film', 'Series', 'Special', 'Short'] as TitleFormat[]).map((format) => (
              <button key={format} className={formatFilters.has(format) ? 'active' : ''} onClick={() => toggleFormat(format)}>
                {format === 'Film' ? <Film size={12} /> : <Tv2 size={12} />}{format === 'Short' ? 'Short-form' : `${format}s`}
              </button>
            ))}
          </div>
          <label className="filter-select-label">
            <span>CONNECTION TYPE</span>
            <select id="connection-filter" name="connection-filter" value={connectionFilter} onChange={(event) => setConnectionFilter(event.target.value as ConnectionType | 'all')}>
              <option value="all">All relationship types</option>
              <option value="multiverse">Multiverse</option>
              <option value="crossover">Crossover</option>
              <option value="time-travel">Time travel</option>
              <option value="timeline-reset">Timeline reset</option>
            </select>
          </label>
          <div className="timeline-rule-note">
            <i />
            <span><b>MCU white · Universes in color</b><small>Thick trunks, thin crossover branches.</small></span>
          </div>
          <div className="year-range">
            <span><b>1944</b> RELEASE YEAR <b>2026</b></span>
            <div><i /><i /></div>
          </div>
        </div>
      </div>
      <div className="catalog-proof">
        <span className="proof-pulse" />
        <div><b>{catalogStats.released} RELEASED TITLES</b><small>Full selected scope loaded locally</small></div>
      </div>
    </aside>
  )
}


function Inspector({
  title,
  onSelect,
  onClose,
}: {
  title: MarvelTitle
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const universe = getUniverse(title.universeId)
  const titleConnections = connectedTo(title.id)
  const releaseOrder = useMemo(() => {
    if (!title.released) return null
    return catalog
      .filter((item) => item.released)
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
      .findIndex((item) => item.id === title.id) + 1
  }, [title.id, title.released])
  const [showWhy, setShowWhy] = useState(true)

  const connectedUniverses = useMemo(() => {
    const ids: UniverseId[] = [title.universeId]
    titleConnections.forEach((connection) => {
      const otherId = connection.from === title.id ? connection.to : connection.from
      const other = catalog.find((item) => item.id === otherId)
      if (other && !ids.includes(other.universeId)) ids.push(other.universeId)
    })
    return ids.map(getUniverse)
  }, [title, titleConnections])

  const whyCopy = title.title === 'Spider-Man: No Way Home'
    ? 'Raimi, Amazing Spider-Man, Sony, and MCU realities connect through a multiverse event.'
    : title.summary || titleConnections[0]?.explanation || 'This title currently has no verified cross-universe connection in the selected scope.'

  return (
    <aside className="inspector">
      <div className="inspector-topline">
        <span><ZoomIn size={13} /> TITLE INSPECTOR</span>
        <button className="inspector-close" onClick={onClose} aria-label="Close title inspector" title="Close inspector and expand map"><X size={15} /></button>
      </div>
      <div className="inspector-scroll">
        <div className={`inspector-art ${title.event ? `event-${title.event}` : ''} ${title.logo ? 'has-logo' : ''}`} style={{ '--accent': universe.color } as React.CSSProperties}>
          {title.logo ? (
            <div className="inspector-logo-wrap">
              <img className="inspector-logo" src={archiveLogoPath(title.logo)} alt={`${title.title} title logo`} decoding="async" />
            </div>
          ) : (
            <div className="inspector-wordmark-fallback"><Sparkles /><span>{title.title}</span></div>
          )}
          <div className="art-gradient" />
          {title.event && <span className="inspector-event-label">{title.event === 'hub' ? 'TVA MULTIVERSE HUB' : title.event === 'future' ? 'ANNOUNCED EVENT' : 'CROSSOVER EVENT'}</span>}
          <div className="inspector-title-lockup"><span>MARVEL {title.universeId === 'mcu' ? 'STUDIOS' : 'ARCHIVE'}</span>{!title.logo && <h2>{title.title}</h2>}</div>
        </div>

        <div className="inspector-meta-row">
          <div><b>{title.year}</b><span>{title.format}</span>{title.seasons && <span>{title.seasons} {title.seasons === 1 ? 'Season' : 'Seasons'}</span>}</div>
          <span className="archive-record-pill">ARCHIVE RECORD</span>
        </div>
        <div className="release-date"><Clock3 size={13} /> Released {formatDate(title.releaseDate)}</div>

        <div className="classification-grid">
          <div><small>UNIVERSE</small><b><i style={{ background: universe.color }} />{universe.name}</b></div>
          <div><small>EARTH DESIGNATION</small><b>{title.earth || 'Not officially assigned'}</b></div>
          <div><small>CONTINUITY</small><b>{title.continuity}</b></div>
          <div><small>STATUS</small><b className={`status-${title.continuityStatus}`}>{title.continuityStatus.replace('-', ' ')}</b></div>
          <div><small>RELEASE-ORDER PLACEMENT</small><b>{releaseOrder ? `#${releaseOrder} of ${catalogStats.released}` : 'Future event'}</b></div>
          <div><small>CHRONOLOGICAL PLACEMENT</small><b>{title.chronologyYear ? `Circa ${title.chronologyYear}` : 'Continuity-specific'}</b></div>
          <div><small>RELATIONSHIPS</small><b>{titleConnections.length} explained links</b></div>
        </div>

        <div className="synopsis-heading"><span><BookOpenText size={14} /> Synopsis</span></div>
        <div className="why-card synopsis-card">
          <p>{title.synopsis || 'Synopsis coming soon — run scripts/fetch-synopses.mjs to fill this in.'}</p>
        </div>

        <button className="why-heading" onClick={() => setShowWhy(!showWhy)}>
          <span><Sparkles size={14} /> Why is this connected?</span>{showWhy ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        {showWhy && (
          <div className="why-card">
            <p>{whyCopy}</p>
            {titleConnections.length > 0 && (
              <div className="connection-explanations">
                {titleConnections.map((connection) => {
                  const otherId = connection.from === title.id ? connection.to : connection.from
                  const other = catalog.find((item) => item.id === otherId)!
                  return (
                    <button key={connection.id} onClick={() => onSelect(other.id)}>
                      <i className={`connection-symbol ${connection.type}`} />
                      <span><b>{other.title}</b><small>{connectionLabel[connection.type]} · {connection.explanation}</small></span>
                      <ChevronRight size={13} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="connected-heading"><span>CONNECTED UNIVERSES</span><small>{connectedUniverses.length}</small></div>
        <div className="connected-universes">
          {connectedUniverses.map((connectedUniverse) => (
            <div key={connectedUniverse.id}>
              <i style={{ background: connectedUniverse.color, boxShadow: `0 0 10px ${connectedUniverse.color}66` }} />
              <span><b>{connectedUniverse.name}</b><small>{connectedUniverse.earth || connectedUniverse.description}</small></span>
              <Check size={12} />
            </div>
          ))}
        </div>

      </div>
    </aside>
  )
}

export default function App() {
  const [selectedId, setSelectedId] = useState(selectedDefaultId)
  const [archiveMode, setArchiveMode] = useState<ArchiveMode>('map')
  const [releaseUniverseId, setReleaseUniverseId] = useState<UniverseId>('mcu')
  // The archive opens as the complete multiverse map. Users can still trim
  // the canvas with the universe switches, format filters, and connection mode.
  const [connectionDisplay, setConnectionDisplay] = useState<ConnectionDisplay>('all')
  const [showAll, setShowAll] = useState(true)
  const [focus, setFocus] = useState(false)
  const [roadToDoomsday, setRoadToDoomsday] = useState(false)
  const [activeUniverse, setActiveUniverse] = useState<UniverseFilter>('all')
  const [query, setQuery] = useState('')
  const [formatFilters, setFormatFilters] = useState<Set<TitleFormat>>(new Set(['Film', 'Series', 'Special', 'Short']))
  const [connectionFilter, setConnectionFilter] = useState<ConnectionType | 'all'>('all')
  const [hiddenUniverses, setHiddenUniverses] = useState<Set<UniverseId>>(new Set())
  const [revealToken, setRevealToken] = useState(0)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [reopenHidden, setReopenHidden] = useState(false)
  // Mobile-only collapsible explore header. Default expanded; desktop is
  // always treated as expanded, so its visuals never change.
  const [exploreExpanded, setExploreExpanded] = useState(true)
  const isMobileToolbar = useIsMobileToolbar()
  // Mobile-only viewport gate for touch drawer/edge gestures. Desktop
  // (and SSR) never runs the interactive sidebar drag.
  const isMobileViewport = () => (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(max-width: 767px)').matches
  )
  // Live drawer offset while a finger drags the sidebar (px, <= 0).
  // Null = no drag, CSS classes own the position.
  const [sidebarDragOffset, setSidebarDragOffset] = useState<number | null>(null)
  const sidebarDragOffsetRef = useRef<number | null>(null)
  const sidebarTouchRef = useRef<{ x: number; time: number } | null>(null)
  const sidebarVelocityRef = useRef(0)
  const swipeStartRef = useRef<{
    x: number
    y: number
    universe: boolean
    fromLeftEdge: boolean
    sidebarDrag: { startX: number; active: boolean } | null
    universeDrag: { active: boolean } | null
  } | null>(null)
  // Live universe-drag state: which content element is being dragged, its
  // width (for fade math), and the neighbor availability in each direction.
  const universeDragRef = useRef<{
    element: HTMLElement
    width: number
    hasNext: boolean
    hasPrevious: boolean
  } | null>(null)
  const universeTouchRef = useRef<{ x: number; time: number } | null>(null)
  const universeVelocityRef = useRef(0)
  const [sidebarOpen, setSidebarOpen] = useState(() => (
    typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches
  ))
  const selected = catalog.find((title) => title.id === selectedId) || catalog[0]

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (inspectorOpen) {
        setInspectorOpen(false)
        setRevealToken((token) => token + 1)
      } else if (sidebarOpen) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inspectorOpen, sidebarOpen])

  // Mobile only: auto-hide the floating OPEN INSPECTOR button while
  // scrolling, then reveal it ~600ms after scroll settles. Desktop is
  // untouched; reduced-motion keeps the button always visible.
  useEffect(() => {
    if (inspectorOpen) {
      setReopenHidden(false)
      return
    }
    const mobileQuery = window.matchMedia('(max-width: 767px)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let settleTimer: number | undefined
    const onScroll = () => {
      if (!mobileQuery.matches || motionQuery.matches) return
      setReopenHidden(true)
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => setReopenHidden(false), 600)
    }
    const onViewportChange = () => {
      if (!mobileQuery.matches || motionQuery.matches) setReopenHidden(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', onViewportChange)
      motionQuery.addEventListener('change', onViewportChange)
    }
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.clearTimeout(settleTimer)
      if (typeof mobileQuery.removeEventListener === 'function') {
        mobileQuery.removeEventListener('change', onViewportChange)
        motionQuery.removeEventListener('change', onViewportChange)
      }
    }
  }, [inspectorOpen])
  const releaseUniverseIndex = Math.max(0, universes.findIndex((universe) => universe.id === releaseUniverseId))
  const releaseGroupsForUniverse = useMemo(() => releaseOrderGroups
    .filter((group) => group.universeId === releaseUniverseId)
    .map((group) => ({
      id: group.id,
      label: group.label.replace(/^.*? · /, '').toUpperCase(),
      subtitle: `${group.startYear}–${group.endYear} · RELEASE ORDER`,
      accent: getUniverse(group.universeId).color,
      titles: group.titles,
    })), [releaseUniverseId])
  const chronologicalUniverseIndex = Math.max(0, CHRONOLOGICAL_UNIVERSES.findIndex((universe) => universe.id === releaseUniverseId))
  const chronologicalEntriesForUniverse = useMemo(() => (chronologicalEntriesByUniverse[releaseUniverseId] || []).map((entry) => ({
    title: entry.title,
    dateLabel: chronologyDateLabel(entry.title),
    sortYear: entry.chronologyYear,
    status: entry.title.continuityStatus === 'alternate'
      ? 'alternate' as const
      : entry.title.continuityStatus === 'mcu-adjacent'
        ? 'mcu-adjacent' as const
        : entry.status,
    note: entry.status === 'approximate'
      ? 'Placement uses the release year as a conservative estimate.'
      : entry.status === 'disputed'
        ? 'Continuity placement is disputed.'
        : undefined,
  })), [releaseUniverseId])

  const selectAndReveal = useCallback((id: string) => {
    const title = catalog.find((item) => item.id === id)
    if (!title) return
    if (activeUniverse !== 'all' && !belongsToUniverseView(title, activeUniverse)) setActiveUniverse('all')
    const revealUniverse = activeUniverse !== 'all' && belongsToUniverseView(title, activeUniverse)
      ? activeUniverse
      : title.universeId
    if (archiveMode === 'chronological') {
      if (!CHRONOLOGICAL_UNIVERSES.some((universe) => universe.id === title.universeId)) setReleaseUniverseId('mcu')
      else if (title.universeId !== releaseUniverseId) setReleaseUniverseId(title.universeId)
    } else if (archiveMode === 'release' && title.universeId !== releaseUniverseId) setReleaseUniverseId(title.universeId)
    if (hiddenUniverses.has(revealUniverse)) {
      const next = new Set(hiddenUniverses); next.delete(revealUniverse); setHiddenUniverses(next)
    }
    setSelectedId(id)
    setInspectorOpen(true)
    if (window.matchMedia('(max-width: 767px)').matches) setSidebarOpen(false)
    setRevealToken((token) => token + 1)
  }, [activeUniverse, archiveMode, hiddenUniverses, releaseUniverseId])

  const changeReleaseUniverse = (universeId: UniverseId) => {
    setReleaseUniverseId(universeId)
    const firstTitle = catalog
      .filter((title) => title.released && title.universeId === universeId)
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))[0]
    if (firstTitle) setSelectedId(firstTitle.id)
  }

  const previousReleaseUniverse = () => {
    const nextIndex = (releaseUniverseIndex - 1 + universes.length) % universes.length
    changeReleaseUniverse(universes[nextIndex].id)
  }

  const nextReleaseUniverse = () => {
    const nextIndex = (releaseUniverseIndex + 1) % universes.length
    changeReleaseUniverse(universes[nextIndex].id)
  }

  // Chronological tabs cycle only the 5 single-continuity film universes;
  // release tabs keep cycling all 10. Shared on purpose, scoped by mode.
  const stepChronologicalUniverse = (direction: 1 | -1) => {
    const nextIndex = (chronologicalUniverseIndex + direction + CHRONOLOGICAL_UNIVERSES.length) % CHRONOLOGICAL_UNIVERSES.length
    changeReleaseUniverse(CHRONOLOGICAL_UNIVERSES[nextIndex].id)
  }

  const changeArchiveMode = (mode: ArchiveMode) => {
    setArchiveMode(mode)
    if (mode !== 'map') setInspectorOpen(false)
    if (mode === 'chronological' && !CHRONOLOGICAL_UNIVERSES.some((universe) => universe.id === releaseUniverseId)) {
      setReleaseUniverseId('mcu')
    }
  }

  // Touch-only swipe navigation between archive views (map <-> release <->
  // chronological), plus an interactive sidebar drawer drag on mobile.
  // Attached to <main className="workspace"> via onTouchStart/onTouchMove/
  // onTouchEnd, so desktop mouse behavior is unchanged.
  const handleWorkspaceTouchStart = (event: React.TouchEvent) => {
    const target = event.target as HTMLElement | null
    if (target && typeof target.closest === 'function') {
      // The inspector is its own panel and form controls must keep their
      // native touch behavior — only bare content areas swipe views.
      // Tab strips keep their native horizontal scroll/tap behavior too.
      // NOTE: .map-viewport is intentionally NOT excluded here: the map's
      // own pointer handlers treat touch as scroll/pinch natively and don't
      // conflict with an edge/drawer drag, while the drawer NEEDS touches
      // that start on the map (it covers the whole screen when closed).
      if (target.closest('aside, input, select, textarea, button, .release-universe-tabs, .chronological-universe-tabs')) {
        swipeStartRef.current = null
        return
      }
    }
    if (event.touches.length !== 1) {
      swipeStartRef.current = null
      return
    }
    const touch = event.touches[0]
    // Horizontal swipes starting on the groups/timeline content area cycle
    // the universe instead of switching views. Everything else keeps the
    // existing view-swipe behavior.
    let universe = false
    if (target && typeof target.closest === 'function') {
      if (archiveMode === 'release' && target.closest('.release-groups')) universe = true
      else if (archiveMode === 'chronological' && target.closest('.chronological-timeline')) universe = true
    }
    // Universe gallery drag (release/chrono content): starts tracking for a
    // live follow, claimed once the gesture is clearly horizontal. Unlike
    // the drawer, this starts anywhere on the content — not just the edge.
    const universeDrag = universe && isMobileViewport()
      ? { active: false }
      : null
    // Sidebar drawer drag: starts on the open drawer (tracks finger for an
    // interactive close) or at the left screen edge (tracks for an open).
    // Swipes starting on the open sidebar's own scroll/buttons keep native
    // behavior — the drag only claims horizontal gestures.
    const onSidebar = Boolean(target && typeof target.closest === 'function' && target.closest('aside.sidebar') && sidebarOpen)
    swipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      universe,
      fromLeftEdge: touch.clientX <= 24,
      sidebarDrag: onSidebar || touch.clientX <= 24 ? { startX: touch.clientX, active: false } : null,
      universeDrag,
    }
  }

  const handleWorkspaceTouchMove = (event: React.TouchEvent) => {
    const start = swipeStartRef.current
    if (!start || !isMobileViewport()) return
    // A live drag re-renders every touchmove — that's the point of an
    // interactive drawer. Bail out of React's synthetic batching by writing
    // straight to the DOM; state only settles at touch-end. Fall back to
    // the native event because React 19 nulls synthetic touches after the
    // handler yields (mid-drag reads would see length 0).
    const nativeTouches: ArrayLike<{ clientX: number; clientY: number }> | undefined =
      event.nativeEvent?.touches ?? event.touches
    if (!nativeTouches || nativeTouches.length !== 1) return
    const touch = nativeTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    // Universe gallery drag runs before the drawer: content areas are never
    // a drawer origin, so the two never compete for one gesture.
    if (start.universeDrag && !start.sidebarDrag?.active) {
      if (!start.universeDrag.active) {
        if (Math.abs(dx) <= 12 || Math.abs(dx) <= 2 * Math.abs(dy)) return
        const element = (event.currentTarget as HTMLElement | null)
          ?.querySelector('.release-groups, .chronological-timeline') as HTMLElement | null
        if (!element) { start.universeDrag = null; return }
        const hasNext = archiveMode === 'release'
          ? releaseUniverseIndex < universes.length - 1
          : chronologicalUniverseIndex < CHRONOLOGICAL_UNIVERSES.length - 1
        const hasPrevious = archiveMode === 'release'
          ? releaseUniverseIndex > 0
          : chronologicalUniverseIndex > 0
        // Dead-end direction: don't claim, let the old snap logic decide.
        if ((dx < 0 && !hasNext) || (dx > 0 && !hasPrevious)) { start.universeDrag = null; return }
        start.universeDrag.active = true
        universeDragRef.current = {
          element,
          width: Math.max(1, element.getBoundingClientRect().width),
          hasNext,
          hasPrevious,
        }
      }
      const drag = universeDragRef.current
      if (!drag) return
      // Rubber-band past the dead end instead of a hard stop.
      const clamped = (dx < 0 && !drag.hasNext) || (dx > 0 && !drag.hasPrevious)
        ? dx * .25
        : dx
      const progress = Math.min(1, Math.abs(clamped) / drag.width)
      drag.element.style.transition = 'none'
      drag.element.style.transform = `translateX(${clamped}px)`
      drag.element.style.opacity = `${1 - progress * .45}`
      const now = performance.now()
      const previous = universeTouchRef.current
      if (previous) {
        const dt = Math.max(1, now - previous.time)
        universeVelocityRef.current = (touch.clientX - previous.x) / dt
      }
      universeTouchRef.current = { x: touch.clientX, time: now }
      swipeStartRef.current = start
      return
    }
    if (!start.sidebarDrag) return
    // Claim the gesture once it's clearly horizontal; vertical scrolling
    // (including the sidebar's own scroll) is never hijacked.
    if (!start.sidebarDrag.active) {
      if (Math.abs(dx) <= 12 || Math.abs(dx) <= 2 * Math.abs(dy)) return
      // Edge swipes only open, drawer swipes only close — wrong-direction
      // drags stay native.
      if (sidebarOpen && dx >= 0) { start.sidebarDrag.active = false; return }
      if (!sidebarOpen && dx <= 0) { start.sidebarDrag.active = false; return }
      start.sidebarDrag.active = true
    }
    // Follow the finger: drawer width capped at the CSS min(86vw, 326px).
    const width = Math.min(window.innerWidth * .86, 326)
    const offset = sidebarOpen ? Math.min(0, dx) : Math.max(-width, Math.min(0, dx - width))
    const now = performance.now()
    const previous = sidebarTouchRef.current
    if (previous) {
      const dt = Math.max(1, now - previous.time)
      sidebarVelocityRef.current = (touch.clientX - previous.x) / dt
    }
    sidebarTouchRef.current = { x: touch.clientX, time: now }
    sidebarDragOffsetRef.current = offset
    const workspace = (event.currentTarget as HTMLElement | null) || document.querySelector('main.workspace')
    const sidebar = workspace?.querySelector('aside.sidebar') as HTMLElement | null
    if (sidebar) {
      sidebar.style.transition = 'none'
      sidebar.style.opacity = '1'
      ;(sidebar.style as CSSStyleDeclaration & { pointerEvents: string }).pointerEvents = 'auto'
      sidebar.style.transform = `translateX(${offset}px)`
    }
    if (workspace) {
      workspace.classList.add('sidebar-dragging')
      workspace.style.setProperty('--sidebar-drag-x', `${offset}px`)
    }
    // Keep React's settle logic in sync without re-rendering mid-drag.
    swipeStartRef.current = start
  }

  const endSidebarDrag = (dx: number) => {
    // Fling (fast swipe) always wins; otherwise release past halfway.
    const width = Math.min(window.innerWidth * .86, 326)
    const fling = Math.abs(sidebarVelocityRef.current) > .45
    if (sidebarOpen) {
      if ((fling && dx < 0) || dx < -width / 2) setSidebarOpen(false)
    } else if ((fling && dx > 0) || dx > width / 2) {
      setSidebarOpen(true)
    }
    // Clear inline drag styles so CSS classes own the settle animation.
    const sidebar = document.querySelector('main.workspace aside.sidebar') as HTMLElement | null
    if (sidebar) {
      sidebar.style.transition = ''
      sidebar.style.opacity = ''
      ;(sidebar.style as CSSStyleDeclaration & { pointerEvents: string }).pointerEvents = ''
      sidebar.style.transform = ''
    }
    document.querySelector('main.workspace')?.classList.remove('sidebar-dragging')
    sidebarDragOffsetRef.current = null
    sidebarTouchRef.current = null
    sidebarVelocityRef.current = 0
    setSidebarDragOffset(null)
  }

  const cancelSidebarDragStyles = () => {
    const sidebar = document.querySelector('main.workspace aside.sidebar') as HTMLElement | null
    if (sidebar) {
      sidebar.style.transition = ''
      sidebar.style.opacity = ''
      ;(sidebar.style as CSSStyleDeclaration & { pointerEvents: string }).pointerEvents = ''
      sidebar.style.transform = ''
    }
    document.querySelector('main.workspace')?.classList.remove('sidebar-dragging')
    sidebarDragOffsetRef.current = null
    sidebarTouchRef.current = null
    sidebarVelocityRef.current = 0
    setSidebarDragOffset(null)
  }

  const settleUniverseDrag = (dx: number) => {
    const drag = universeDragRef.current
    universeDragRef.current = null
    universeTouchRef.current = null
    if (!drag) return
    // Fling wins; otherwise commit past ~22% of the content width so a
    // deliberate swipe doesn't demand a full-width drag on a phone.
    const fling = Math.abs(universeVelocityRef.current) > .45
    const commit = fling || Math.abs(dx) > drag.width * .22
    universeVelocityRef.current = 0
    const direction = dx < 0 ? 1 : -1
    const canGo = direction === 1 ? drag.hasNext : drag.hasPrevious
    if (commit && canGo) {
      // Slide out + fade, swap universe under cover, slide back in.
      const outX = direction === 1 ? -drag.width * .35 : drag.width * .35
      drag.element.style.transition = 'transform .16s ease-out, opacity .16s ease-out'
      drag.element.style.transform = `translateX(${outX}px)`
      drag.element.style.opacity = '0'
      window.setTimeout(() => {
        if (archiveMode === 'release') {
          if (direction === 1) nextReleaseUniverse()
          else previousReleaseUniverse()
        } else {
          stepChronologicalUniverse(direction as 1 | -1)
        }
        // Next universe enters from the swipe side on the following frame.
        requestAnimationFrame(() => {
          const next = document.querySelector('main.workspace .release-groups, main.workspace .chronological-timeline') as HTMLElement | null
          if (!next) return
          const fromX = direction === 1 ? drag.width * .35 : -drag.width * .35
          next.style.transition = 'none'
          next.style.transform = `translateX(${fromX}px)`
          next.style.opacity = '0'
          requestAnimationFrame(() => {
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            next.style.transition = reduced ? 'none' : 'transform .22s ease-out, opacity .22s ease-out'
            next.style.transform = 'translateX(0)'
            next.style.opacity = '1'
            window.setTimeout(() => {
              next.style.transition = ''
              next.style.transform = ''
              next.style.opacity = ''
            }, reduced ? 0 : 240)
          })
        })
      }, 160)
      return
    }
    // Bounce back: spring home with the settle transition.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    drag.element.style.transition = reduced ? 'none' : 'transform .22s ease-out, opacity .22s ease-out'
    drag.element.style.transform = 'translateX(0)'
    drag.element.style.opacity = '1'
    window.setTimeout(() => {
      drag.element.style.transition = ''
      drag.element.style.transform = ''
      drag.element.style.opacity = ''
    }, reduced ? 0 : 240)
  }

  const handleWorkspaceTouchEnd = (event: React.TouchEvent) => {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    // A live universe drag already followed the finger — settle it and skip
    // every snap path below.
    if (start.universeDrag?.active) {
      if (isMobileViewport()) settleUniverseDrag(dx)
      else {
        const drag = universeDragRef.current
        universeDragRef.current = null
        if (drag) {
          drag.element.style.transition = ''
          drag.element.style.transform = ''
          drag.element.style.opacity = ''
        }
      }
      cancelSidebarDragStyles()
      return
    }
    // An interactive drawer drag already moved the sidebar live — just
    // settle it (fling or past-halfway) instead of running swipe logic.
    if (start.sidebarDrag?.active) {
      if (isMobileViewport()) endSidebarDrag(dx)
      else cancelSidebarDragStyles()
      return
    }
    cancelSidebarDragStyles()
    // Swipe from the left screen edge rightwards opens the sidebar.
    // Runs before view/universe swipes; uses a shorter distance so the
    // drawer feels responsive. Map gestures, open sidebar, and form
    // controls/panels are already excluded at touch-start.
    if (start.fromLeftEdge && !sidebarOpen && dx > 60 && Math.abs(dx) > 2 * Math.abs(dy)) {
      setSidebarOpen(true)
      return
    }
    // Horizontal swipes only: vertical scrolling is never hijacked. (Live
    // universe drags already settled above; this is the no-drag fallback.)
    if (Math.abs(dx) <= 80 || Math.abs(dx) <= 2.5 * Math.abs(dy)) return
    const direction = dx < 0 ? 1 : -1
    if (start.universe && !start.universeDrag) {
      // Swipe left = next universe, swipe right = previous universe.
      // No wrapping, for consistency with view swipes.
      if (archiveMode === 'release') {
        if (direction === 1 && releaseUniverseIndex >= universes.length - 1) return
        if (direction === -1 && releaseUniverseIndex <= 0) return
        if (direction === 1) nextReleaseUniverse()
        else previousReleaseUniverse()
        return
      }
      if (archiveMode === 'chronological') {
        if (direction === 1 && chronologicalUniverseIndex >= CHRONOLOGICAL_UNIVERSES.length - 1) return
        if (direction === -1 && chronologicalUniverseIndex <= 0) return
        stepChronologicalUniverse(direction)
        return
      }
    }
    const index = ARCHIVE_MODE_ORDER.indexOf(archiveMode)
    // Swipe left = next view, swipe right = previous view. No wrapping:
    // map is first, chronological is last.
    const nextIndex = index + (dx < 0 ? 1 : -1)
    if (nextIndex < 0 || nextIndex >= ARCHIVE_MODE_ORDER.length) return
    changeArchiveMode(ARCHIVE_MODE_ORDER[nextIndex])
  }

  const toggleFormat = (format: TitleFormat) => {
    const next = new Set(formatFilters)
    if (next.has(format)) {
      if (next.size > 1) next.delete(format)
    } else next.add(format)
    setFormatFilters(next)
  }

  const toggleUniverse = (id: UniverseId) => {
    const next = new Set(hiddenUniverses)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setHiddenUniverses(next)
    if (next.has(id) && activeUniverse === id) setActiveUniverse('all')
  }

  const toggleAllUniverses = () => {
    if (hiddenUniverses.size === 0) {
      setHiddenUniverses(new Set(universes.map((universe) => universe.id)))
      setActiveUniverse('all')
      return
    }
    setHiddenUniverses(new Set())
  }

  const inspectorPanel = inspectorOpen ? (
    <Inspector
      title={selected}
      onSelect={selectAndReveal}
      onClose={() => { setInspectorOpen(false); setRevealToken((token) => token + 1) }}
    />
  ) : (
    <button
      className={`inspector-reopen${reopenHidden ? ' inspector-reopen-hidden' : ''}`}
      onClick={() => { setInspectorOpen(true); setRevealToken((token) => token + 1) }}
      aria-label={`Open title inspector for ${selected.title}`}
      aria-hidden={reopenHidden || undefined}
      tabIndex={reopenHidden ? -1 : undefined}
      title={`Open ${selected.title} details`}
    >
      <PanelRightOpen size={16} />
      <span>OPEN INSPECTOR</span>
    </button>
  )

  return (
    <div className="app-shell">
      <TopNavigation
        query={query}
        setQuery={setQuery}
        onSelect={selectAndReveal}
        archiveMode={archiveMode}
        onModeChange={changeArchiveMode}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
      />
      <main className={`workspace ${inspectorOpen ? 'inspector-open' : 'inspector-closed'} ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}${sidebarDragOffset !== null ? ' sidebar-dragging' : ''}`} onTouchStart={handleWorkspaceTouchStart} onTouchMove={handleWorkspaceTouchMove} onTouchEnd={handleWorkspaceTouchEnd} style={sidebarDragOffset !== null ? ({ '--sidebar-drag-x': `${sidebarDragOffset}px` } as React.CSSProperties) : undefined}>
        <button
          type="button"
          className="mobile-scrim"
          onClick={() => {
            setSidebarOpen(false)
            if (inspectorOpen) setRevealToken((token) => token + 1)
            setInspectorOpen(false)
          }}
          aria-label="Close open archive panels"
          tabIndex={-1}
        />
        <Sidebar
          open={sidebarOpen}
          activeUniverse={activeUniverse}
          setActiveUniverse={(id) => {
            setActiveUniverse(id)
            setFocus(false)
            if (id !== 'all' && hiddenUniverses.has(id)) {
              const next = new Set(hiddenUniverses); next.delete(id); setHiddenUniverses(next)
            }
          }}
          hiddenUniverses={hiddenUniverses}
          toggleUniverse={toggleUniverse}
          toggleAllUniverses={toggleAllUniverses}
          formatFilters={formatFilters}
          toggleFormat={toggleFormat}
          connectionFilter={connectionFilter}
          setConnectionFilter={setConnectionFilter}
        />
        {archiveMode === 'release' ? (
          <ReleaseOrder
            universeId={releaseUniverseId}
            groups={releaseGroupsForUniverse}
            universeOptions={universes}
            universeIndex={releaseUniverseIndex}
            onUniverseChange={changeReleaseUniverse}
            onPreviousUniverse={previousReleaseUniverse}
            onNextUniverse={nextReleaseUniverse}
            selectedId={selected.id}
            selectionActive={inspectorOpen}
            onSelectTitle={selectAndReveal}
          />
        ) : archiveMode === 'chronological' ? (
          <ChronologicalOrder
            universeId={releaseUniverseId}
            entries={chronologicalEntriesForUniverse}
            universeOptions={CHRONOLOGICAL_UNIVERSES}
            universeIndex={chronologicalUniverseIndex}
            onUniverseChange={changeReleaseUniverse}
            onPreviousUniverse={() => stepChronologicalUniverse(-1)}
            onNextUniverse={() => stepChronologicalUniverse(1)}
            selectedId={selected.id}
            selectionActive={inspectorOpen}
            onSelectTitle={selectAndReveal}
          />
        ) : (
          <>
            <ExploreToolbar
              connectionDisplay={connectionDisplay}
              setConnectionDisplay={setConnectionDisplay}
              showAll={showAll}
              setShowAll={setShowAll}
              focus={focus}
              setFocus={setFocus}
              roadToDoomsday={roadToDoomsday}
              setRoadToDoomsday={setRoadToDoomsday}
              expanded={isMobileToolbar ? exploreExpanded : true}
              onToggleExpanded={() => setExploreExpanded((open) => !open)}
              collapsible={isMobileToolbar}
            />
            <MultiverseMap
              selectedId={selected.id}
              selectionActive={inspectorOpen}
              onSelect={selectAndReveal}
              connectionDisplay={connectionDisplay}
              showAll={showAll}
              roadToDoomsday={roadToDoomsday}
              activeUniverse={activeUniverse}
              focus={focus}
              formatFilters={formatFilters}
              connectionFilter={connectionFilter}
              hiddenUniverses={hiddenUniverses}
              revealToken={revealToken}
            />
          </>
        )}
        {inspectorPanel}
      </main>
    </div>
  )
}
