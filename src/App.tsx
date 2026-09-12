import { useCallback, useMemo, useState } from 'react'
import {
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
  type UniverseId,
} from './data/catalog'
import ReleaseOrder from './ReleaseOrder'
import { releaseOrderGroups } from './releaseGroups'
import ChronologicalOrder, { chronologyDateLabel } from './ChronologicalOrder'
import { chronologicalEntriesByUniverse } from './chronologyData'
import MultiverseMap from './MultiverseMap'

type UniverseFilter = UniverseId | 'all'
type ConnectionDisplay = 'selected' | 'events' | 'all' | 'off'
type ArchiveMode = 'map' | 'release' | 'chronological'

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})

const formatDate = (date: string) => {
  if (date.length === 4) return `${date} · exact day unavailable`
  return DATE_FORMATTER.format(new Date(`${date}T00:00:00Z`))
}

const getUniverse = (id: UniverseId) => universes.find((universe) => universe.id === id)!

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
                <button key={title.id} onMouseDown={() => { onSelect(title.id); setQuery('') }}>
                  <span className="search-result-mark" style={{ '--accent': getUniverse(title.universeId).color } as React.CSSProperties}>
                    {title.logo ? <img src={title.logo} alt="" /> : title.title.slice(0, 1)}
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

function ExploreToolbar({
  connectionDisplay,
  setConnectionDisplay,
  showAll,
  setShowAll,
  focus,
  setFocus,
}: {
  connectionDisplay: ConnectionDisplay
  setConnectionDisplay: (value: ConnectionDisplay) => void
  showAll: boolean
  setShowAll: (value: boolean) => void
  focus: boolean
  setFocus: (value: boolean) => void
}) {
  return (
    <section className="explore-toolbar">
      <div className="explore-title">
        <span className="eyebrow"><Sparkles size={12} /> COMPLETE SCREEN ARCHIVE</span>
        <h1>Explore the Marvel Multiverse</h1>
        <p>Separate worlds. Connected stories.</p>
      </div>
      <div className="view-controls">
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
        </div>
      </div>
    </section>
  )
}

function Sidebar({
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
    <aside className="sidebar">
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
              className={`universe-row ${activeUniverse === universe.id ? 'active' : ''} ${hiddenUniverses.has(universe.id) ? 'off' : ''}`}
            >
              <button className="universe-select" onClick={() => setActiveUniverse(universe.id)}>
                <b>{universe.name}</b><small>{counts[universe.id]}</small>
              </button>
              <button className={`universe-switch ${!hiddenUniverses.has(universe.id) ? 'on' : ''}`} style={{ '--accent': universe.color } as React.CSSProperties} onClick={() => toggleUniverse(universe.id)} aria-label={`${hiddenUniverses.has(universe.id) ? 'Show' : 'Hide'} ${universe.name} timeline`} aria-pressed={!hiddenUniverses.has(universe.id)}>
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
              <img className="inspector-logo" src={title.logo} alt={`${title.title} title logo`} />
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
  const [activeUniverse, setActiveUniverse] = useState<UniverseFilter>('all')
  const [query, setQuery] = useState('')
  const [formatFilters, setFormatFilters] = useState<Set<TitleFormat>>(new Set(['Film', 'Series', 'Special', 'Short']))
  const [connectionFilter, setConnectionFilter] = useState<ConnectionType | 'all'>('all')
  const [hiddenUniverses, setHiddenUniverses] = useState<Set<UniverseId>>(new Set())
  const [revealToken, setRevealToken] = useState(0)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const selected = catalog.find((title) => title.id === selectedId) || catalog[0]
  const releaseUniverseIndex = Math.max(0, universes.findIndex((universe) => universe.id === releaseUniverseId))
  const releaseGroupsForUniverse = useMemo(() => releaseOrderGroups
    .filter((group) => group.universeId === releaseUniverseId)
    .map((group) => ({
      id: group.id,
      label: group.universeId === 'mcu' ? group.label.replace('MCU · ', '').toUpperCase() : group.label.toUpperCase(),
      subtitle: `${group.startYear}–${group.endYear} · RELEASE ORDER`,
      accent: getUniverse(group.universeId).color,
      titles: group.titles,
    })), [releaseUniverseId])
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
    if ((archiveMode === 'release' || archiveMode === 'chronological') && title.universeId !== releaseUniverseId) setReleaseUniverseId(title.universeId)
    if (hiddenUniverses.has(revealUniverse)) {
      const next = new Set(hiddenUniverses); next.delete(revealUniverse); setHiddenUniverses(next)
    }
    setSelectedId(id)
    setInspectorOpen(true)
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

  const changeArchiveMode = (mode: ArchiveMode) => {
    setArchiveMode(mode)
    if (mode !== 'map') setInspectorOpen(false)
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
      className="inspector-reopen"
      onClick={() => { setInspectorOpen(true); setRevealToken((token) => token + 1) }}
      aria-label={`Open title inspector for ${selected.title}`}
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
      <main className={`workspace ${inspectorOpen ? 'inspector-open' : 'inspector-closed'} ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Sidebar
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
            onSelectTitle={selectAndReveal}
          />
        ) : archiveMode === 'chronological' ? (
          <ChronologicalOrder
            universeId={releaseUniverseId}
            entries={chronologicalEntriesForUniverse}
            universeOptions={universes}
            universeIndex={releaseUniverseIndex}
            onUniverseChange={changeReleaseUniverse}
            onPreviousUniverse={previousReleaseUniverse}
            onNextUniverse={nextReleaseUniverse}
            selectedId={selected.id}
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
            />
            <MultiverseMap
              selectedId={selected.id}
              selectionActive={inspectorOpen}
              onSelect={selectAndReveal}
              connectionDisplay={connectionDisplay}
              showAll={showAll}
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
