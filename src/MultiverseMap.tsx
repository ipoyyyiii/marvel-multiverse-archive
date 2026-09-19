import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { ArrowRight, Crosshair, Maximize2, Minus, Plus, Scan, Waves, X } from 'lucide-react'
import { catalog, connections, universes, type ConnectionType, type TitleFormat, type UniverseId } from './data/catalog'
import { EnergyBranch, EnergySpine, TimelineFlowPulse, streamColor, timelineColor, useReducedMotion, type FlowSpine } from './TimelineEnergy'
import { MAP_UNIVERSE_ORDER, MAX_ZOOM, MIN_ZOOM, OVERVIEW_ZOOM, NODE_HEIGHT, NODE_WIDTH, clampMapZoom, fitMapZoom, makeMapLayout, reprojectMapPoint, routeMapConnections, type GraphLayout, type MapPoint, type MapRoute, type NodePosition } from './mapGeometry'
import MapMinimap from './MapMinimap'
import { selectMapTitles } from './mapSelection'
import { archiveLogoPath } from './data/logoAssets'
import './multiverseMap.css'

type ConnectionDisplay = 'selected' | 'events' | 'all' | 'off'
interface MapProps {
  selectedId: string
  /** Keeps the last title available for reopening the inspector without leaving selection chrome behind. */
  selectionActive: boolean
  onSelect: (id: string) => void
  connectionDisplay: ConnectionDisplay
  showAll: boolean
  activeUniverse: UniverseId | 'all'
  focus: boolean
  formatFilters: Set<TitleFormat>
  connectionFilter: ConnectionType | 'all'
  hiddenUniverses: Set<UniverseId>
  revealToken: number
}

const titleById = new Map(catalog.map((title) => [title.id, title]))
const universeById = new Map(universes.map((universe) => [universe.id, universe]))
const linkById = new Map(connections.map((link) => [link.id, link]))
const relationshipCounts = new Map<string, number>()
for (const link of connections) {
  relationshipCounts.set(link.from, (relationshipCounts.get(link.from) || 0) + 1)
  relationshipCounts.set(link.to, (relationshipCounts.get(link.to) || 0) + 1)
}

const TitleNode = memo(function TitleNode({ node, selected, connected, onSelect }: {
  node: NodePosition
  selected: boolean
  connected: boolean
  onSelect: (id: string) => void
}) {
  const { title, scale } = node
  const [failedLogo, setFailedLogo] = useState(false)
  const logo = title.logo && !failedLogo ? archiveLogoPath(title.logo) : undefined
  const universe = universeById.get(title.universeId)!
  return (
    <button
      className={`title-node map-title node-${node.side} ${selected ? 'selected' : ''} ${connected ? 'connection-endpoint' : ''} ${title.event ? `event-${title.event}` : ''}`}
      data-title-id={title.id}
      data-anchor-x={node.x}
      data-anchor-y={node.trackY}
      style={{ left: node.x - NODE_WIDTH * scale / 2, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT, transform: `scale(${scale})`, '--accent': universe.color } as CSSProperties}
      onClick={(event) => { event.stopPropagation(); onSelect(title.id) }}
      title={`${title.title} · ${title.year}\n${title.continuity}${title.earth ? ` · ${title.earth}` : ''}`}
      aria-label={`Open ${title.title}, ${title.year} ${title.format}`}
      aria-pressed={selected}
    >
      {title.event && <span className={`event-kicker ${title.event}`}>{title.event === 'crossover' ? 'CROSSOVER EVENT' : title.event === 'hub' ? 'TVA HUB' : 'ANNOUNCED'}</span>}
      <span className={`node-art ${logo ? 'logo-node' : 'wordmark-node'}`}>
        {logo ? <img className="node-logo" src={logo} alt="" draggable={false} loading={selected || connected ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedLogo(true)} />
          : <span className={`node-wordmark ${title.title.length > 30 ? 'long' : ''}`}>{title.title}</span>}
        {(selected || connected) && <span className="relationship-count">{relationshipCounts.get(title.id) || 0}</span>}
      </span>
      {logo && <span className="map-title-caption">{title.title}</span>}
      <span className="node-meta"><span>{title.year} <i>·</i> {title.format}</span>{title.seasons && <em>{title.seasons} {title.seasons > 1 ? 'seasons' : 'season'}</em>}{!title.released && <em className="future-date">ANNOUNCED</em>}</span>
    </button>
  )
})

/** Pan changes the native scroll position, never the geometry or static artwork. */
const MapScene = memo(function MapScene({ layout, routes, selectedId, activeRouteId, flowing, onSelect, onRoute }: {
  layout: GraphLayout
  routes: MapRoute[]
  selectedId: string
  activeRouteId: string | null
  flowing: boolean
  onSelect: (id: string) => void
  onRoute: (id: string | null) => void
}) {
  const zoom = layout.zoom
  const detailZoom = Math.max(OVERVIEW_ZOOM, zoom)
  const viewport = useMemo(() => ({ left: 0, top: 0, right: layout.width, bottom: layout.height }), [layout.width, layout.height])
  const spines = useMemo<FlowSpine[]>(() => layout.lanes.map((lane) => ({
    id: `flow-${lane.universeId}`, universeId: lane.universeId, start: lane.start, end: lane.end, y: lane.trackY,
    streamColor: streamColor(lane.universeId), seed: [...lane.universeId].reduce((value, c) => value + c.charCodeAt(0), 0),
  })), [layout.lanes])
  const connectedIds = useMemo(() => new Set(routes.filter((route) => activeRouteId ? route.id === activeRouteId : route.from === selectedId || route.to === selectedId).flatMap((route) => [route.from, route.to])), [routes, activeRouteId, selectedId])

  return <div className="scene-frame" style={{ width: layout.width * zoom, height: layout.height * zoom }}>
    <div className="world-scene" style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})` }}>
      {layout.lanes.map((lane) => <div key={lane.universeId} className="lane-surface" data-lane={lane.universeId} style={{ top: lane.y, height: lane.height }} />)}
      <svg className="graph-lines" width={layout.width} height={layout.height} aria-label="Title relationships">
        {routes.map((route) => {
          const from = layout.positions.get(route.from)!
          const to = layout.positions.get(route.to)!
          const source = universeById.get(from.spineKey as UniverseId)!
          const target = universeById.get(to.spineKey as UniverseId)!
          const highlighted = activeRouteId ? route.id === activeRouteId : route.from === selectedId || route.to === selectedId
          const temporal = route.type === 'time-travel' || route.type === 'timeline-reset'
          return <g key={route.id} className={`map-relationship ${temporal ? 'temporal-relationship' : ''} ${highlighted ? 'is-highlighted' : ''}`} data-connection-id={route.id}>
            <EnergyBranch id={`branch-${route.id}`} from={route.from} to={route.to} d={route.d} start={route.start} end={route.end}
              sourceColor={temporal ? '#efb963' : timelineColor(source.id, source.color)} targetColor={temporal ? '#efb963' : timelineColor(target.id, target.color)}
              highlighted={highlighted} zoom={detailZoom} flowing={flowing && highlighted} viewport={viewport} />
            <path className="branch-hit-area" d={route.d} fill="none" stroke="transparent" strokeWidth={24 / zoom}
              role="button" tabIndex={0} aria-expanded={activeRouteId === route.id} aria-controls="map-connection-detail"
              onClick={(event) => { event.stopPropagation(); onRoute(route.id) }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); onRoute(route.id) }
              }}
              aria-label={`Explain connection: ${titleById.get(route.from)?.title} to ${titleById.get(route.to)?.title}`} />
          </g>
        })}
        {spines.map((spine) => <EnergySpine key={spine.id} id={spine.id} universeId={spine.universeId} color={universeById.get(spine.universeId as UniverseId)!.color}
          start={spine.start} end={spine.end} y={spine.y} zoom={detailZoom} viewport={viewport} flowing={flowing} renderStreams={false} />)}
        {[...layout.positions.values()].map((node) => {
          const universe = universeById.get(node.spineKey as UniverseId)!
          const connected = connectedIds.has(node.title.id)
          const selected = selectedId === node.title.id
          const stemEnd = node.side === 'above' ? node.y + NODE_HEIGHT * node.scale + 4 * node.scale : node.y - 6 * node.scale
          return <g key={node.title.id} className={`map-title-anchor ${connected ? 'connected' : ''} ${selected ? 'selected' : ''}`} data-anchor-for={node.title.id}>
            <line className="title-stem" x1={node.x} x2={node.x} y1={node.trackY} y2={stemEnd} stroke={selected || connected ? '#ffffff' : timelineColor(universe.id, universe.color)} strokeWidth={(connected ? 1.8 : 1) / detailZoom} />
            <circle cx={node.x} cy={node.trackY} r={(selected ? 6 : connected ? 4.5 : 2.2) / detailZoom} fill={selected ? '#ed1d35' : '#eff6ff'} stroke={connected || selected ? '#fff' : timelineColor(universe.id, universe.color)} strokeWidth={1 / detailZoom} />
          </g>
        })}
      </svg>
      {spines.map((spine) => <TimelineFlowPulse key={spine.id} spine={spine} zoom={detailZoom} flowing={flowing} />)}
      {[...layout.positions.values()].map((node) => <TitleNode key={node.title.id} node={node} selected={node.title.id === selectedId} connected={connectedIds.has(node.title.id)} onSelect={onSelect} />)}
    </div>
  </div>
})

export default function MultiverseMap({ selectedId, selectionActive, onSelect, connectionDisplay, showAll, activeUniverse, focus, formatFilters, connectionFilter, hiddenUniverses, revealToken }: MapProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(.88)
  const [scroll, setScroll] = useState({ left: 0, top: 0 })
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 650 })
  const [dragging, setDragging] = useState(false)
  const [flowEnabled, setFlowEnabled] = useState(true)
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null)
  const reducedMotion = useReducedMotion()
  const dragRef = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null)
  const gestureFrame = useRef(0)
  const gestureMoved = useRef(false)
  const suppressClickUntil = useRef(0)
  const scrollFrame = useRef(0)
  const scrollCommitTimer = useRef(0)
  const lastScrollCommit = useRef(0)
  const previous = useRef<{ layout: GraphLayout; revealToken: number } | null>(null)
  const pendingZoomAnchor = useRef<
    | { point: MapPoint; layout: GraphLayout; screen: MapPoint }
    | 'home'
    | null
  >(null)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ distance: number; zoom: number; point: MapPoint; layout: GraphLayout } | null>(null)
  const selected = titleById.get(selectedId)!
  // Inspector close keeps the last title in memory for a quick reopen, but
  // removes all map selection chrome (red junction, stems, routes, minimap).
  const activeSelectionId = selectionActive ? selectedId : ''
  const focusedUniverse = focus ? selected.universeId : activeUniverse
  const universeIds = useMemo(() => MAP_UNIVERSE_ORDER.filter((id) => !hiddenUniverses.has(id) && (focusedUniverse === 'all' || id === focusedUniverse)), [focusedUniverse, hiddenUniverses])
  const selectedForLayout = showAll ? '' : selectedId
  const stagedTitles = useMemo(() => selectMapTitles(catalog, connections, { universeIds, showAll, selectedId: selectedForLayout, formats: formatFilters }), [universeIds, showAll, selectedForLayout, formatFilters])
  const geometryZoom = Math.max(OVERVIEW_ZOOM, zoom)
  const geometryLayout = useMemo(() => makeMapLayout(stagedTitles, universeIds, geometryZoom), [stagedTitles, universeIds, geometryZoom])
  const layout = useMemo(() => ({ ...geometryLayout, zoom }), [geometryLayout, zoom])
  const currentView = useRef({ layout, zoom })
  useLayoutEffect(() => { currentView.current = { layout, zoom } }, [layout, zoom])
  const routes = useMemo(() => {
    if (connectionDisplay === 'off') return []
    const eligible = connections.filter((link) => {
      if (connectionFilter !== 'all' && link.type !== connectionFilter) return false
      const from = geometryLayout.positions.get(link.from)
      const to = geometryLayout.positions.get(link.to)
      if (!from || !to) return false
      if (from.spineKey === to.spineKey && link.type !== 'time-travel' && link.type !== 'timeline-reset') return false
      if (connectionDisplay === 'selected') return Boolean(activeSelectionId) && (link.from === activeSelectionId || link.to === activeSelectionId)
      if (connectionDisplay === 'events') return Boolean(from.title.event || to.title.event)
      return true
    })
    return routeMapConnections(eligible, geometryLayout)
  }, [geometryLayout, connectionDisplay, connectionFilter, activeSelectionId])
  // Branch explanations are independent from the title inspector, so a
  // relationship can be tapped directly while the inspector is closed.
  const activeRoute = routes.find((route) => route.id === activeRouteId)
  const selectedRouteIds = useMemo(() => routes.filter((route) => route.from === activeSelectionId || route.to === activeSelectionId).map((route) => route.id), [routes, activeSelectionId])

  const updateScroll = useCallback(() => {
    if (scrollFrame.current) return
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = 0
      const element = viewportRef.current
      if (!element) return
      const commit = () => {
        scrollCommitTimer.current = 0
        lastScrollCommit.current = performance.now()
        setScroll({ left: element.scrollLeft, top: element.scrollTop })
      }
      const remaining = 82 - (performance.now() - lastScrollCommit.current)
      if (remaining > 0) {
        if (!scrollCommitTimer.current) scrollCommitTimer.current = window.setTimeout(commit, remaining)
      } else commit()
    })
  }, [])
  useEffect(() => () => {
    cancelAnimationFrame(scrollFrame.current)
    cancelAnimationFrame(gestureFrame.current)
    if (scrollCommitTimer.current) window.clearTimeout(scrollCommitTimer.current)
    scrollFrame.current = 0
    gestureFrame.current = 0
    scrollCommitTimer.current = 0
    pointersRef.current.clear()
    pinchRef.current = null
  }, [])
  useEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const observer = new ResizeObserver(() => setViewportSize({ width: element.clientWidth, height: element.clientHeight }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!activeRoute) return
    const closeConnection = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setActiveRouteId(null)
    }
    document.addEventListener('keydown', closeConnection, true)
    return () => document.removeEventListener('keydown', closeConnection, true)
  }, [activeRoute?.id])

  const centerOn = useCallback((id: string, behavior: ScrollBehavior = 'smooth') => {
    const element = viewportRef.current
    const node = layout.positions.get(id)
    if (!element || !node) return
    element.scrollTo({ left: node.x * zoom - element.clientWidth / 2, top: node.trackY * zoom - element.clientHeight / 2, behavior: reducedMotion ? 'auto' : behavior })
  }, [layout, zoom, reducedMotion])

  // Reflow preserves a nearby title. Zoom is never followed by a selected-title timeout.
  useLayoutEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const old = previous.current
    const pending = pendingZoomAnchor.current
    if (pending === 'home') element.scrollTo({ left: 0, top: 0, behavior: 'auto' })
    else if (pending) {
      const point = reprojectMapPoint(pending.point, pending.layout, layout)
      element.scrollTo({ left: point.x * zoom - pending.screen.x, top: point.y * zoom - pending.screen.y, behavior: 'auto' })
    } else if (!old || revealToken !== old.revealToken || layout !== old.layout) {
      const target = layout.positions.get(selectedId) || [...layout.positions.values()].find((node) => node.spineKey === 'mcu') || layout.positions.values().next().value
      if (target) element.scrollTo({ left: target.x * zoom - element.clientWidth / 2, top: target.trackY * zoom - element.clientHeight / 2, behavior: 'auto' })
      else element.scrollTo({ left: 0, top: 0, behavior: 'auto' })
    }
    pendingZoomAnchor.current = null
    previous.current = { layout, revealToken }
    setScroll({ left: element.scrollLeft, top: element.scrollTop })
  }, [layout, revealToken, selectedId, updateScroll, zoom])

  const changeZoom = useCallback((value: number, screenPoint?: MapPoint) => {
    const { zoom: currentZoom, layout: currentLayout } = currentView.current
    const next = clampMapZoom(value)
    if (next === currentZoom) return
    const element = viewportRef.current
    if (element) {
      const screen = screenPoint || { x: element.clientWidth / 2, y: element.clientHeight / 2 }
      pendingZoomAnchor.current = {
        point: { x: (element.scrollLeft + screen.x) / currentZoom, y: (element.scrollTop + screen.y) / currentZoom },
        layout: currentLayout, screen,
      }
    }
    setZoom(next)
  }, [])

  // A non-passive listener prevents the browser's own page zoom from competing.
  useEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        const rect = element.getBoundingClientRect()
        changeZoom(currentView.current.zoom * Math.exp(-Math.max(-60, Math.min(60, event.deltaY)) * .008), { x: event.clientX - rect.left, y: event.clientY - rect.top })
      }
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [changeZoom])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const element = viewportRef.current!
    if (!pointersRef.current.size) {
      gestureMoved.current = false
      suppressClickUntil.current = 0
    }
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()]
      const distance = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y))
      const rect = element.getBoundingClientRect()
      const screenX = (a.x + b.x) / 2 - rect.left
      const screenY = (a.y + b.y) / 2 - rect.top
      const view = currentView.current
      pinchRef.current = { distance, zoom: view.zoom, layout: view.layout,
        point: { x: (element.scrollLeft + screenX) / view.zoom, y: (element.scrollTop + screenY) / view.zoom } }
      dragRef.current = null
      gestureMoved.current = true
      setDragging(false)
      for (const id of pointersRef.current.keys()) element.setPointerCapture(id)
      return
    }
    // Leave taps on artwork and branches alone. Capture only after movement
    // exceeds the drag threshold, or when the second finger begins a pinch.
    if (pointersRef.current.size === 1) dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: element.scrollLeft, top: element.scrollTop }
  }
  const applyGesture = () => {
    gestureFrame.current = 0
    const element = viewportRef.current
    if (!element) return
    const pinch = pinchRef.current
    if (pinch && pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()]
      const rect = element.getBoundingClientRect()
      const screen = { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top }
      const next = clampMapZoom(pinch.zoom * Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)) / pinch.distance)
      if (next !== currentView.current.zoom) {
        pendingZoomAnchor.current = { point: pinch.point, layout: pinch.layout, screen }
        setZoom(next)
      } else {
        const point = reprojectMapPoint(pinch.point, pinch.layout, currentView.current.layout)
        element.scrollTo({ left: point.x * next - screen.x, top: point.y * next - screen.y, behavior: 'auto' })
      }
      return
    }
    const drag = dragRef.current
    const point = drag && pointersRef.current.get(drag.id)
    if (drag && point && gestureMoved.current) {
      element.scrollLeft = drag.left - (point.x - drag.x)
      element.scrollTop = drag.top - (point.y - drag.y)
    }
  }
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const drag = dragRef.current
    if (drag && !gestureMoved.current && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 7) return
    gestureMoved.current = true
    if (drag) setDragging(true)
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId)
    if (!gestureFrame.current) gestureFrame.current = requestAnimationFrame(applyGesture)
  }
  const stopDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return
    if (gestureFrame.current) {
      cancelAnimationFrame(gestureFrame.current)
      if (event.type === 'pointerup') applyGesture()
      gestureFrame.current = 0
    }
    pointersRef.current.delete(event.pointerId)
    if (gestureMoved.current) suppressClickUntil.current = performance.now() + 500
    pinchRef.current = null
    const remaining = pointersRef.current.entries().next().value
    const element = viewportRef.current!
    dragRef.current = remaining ? { id: remaining[0], ...remaining[1], left: element.scrollLeft, top: element.scrollTop } : null
    setDragging(false)
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
  }
  const navigateMinimap = useCallback(({ x, y }: { x: number; y: number }) => {
    const element = viewportRef.current
    if (element) element.scrollTo({ left: x * zoom - element.clientWidth / 2, top: y * zoom - element.clientHeight / 2, behavior: 'auto' })
  }, [zoom])
  const handleMapSelect = useCallback((id: string) => {
    setActiveRouteId(null)
    onSelect(id)
  }, [onSelect])
  const resetView = (next: number) => {
    pendingZoomAnchor.current = 'home'
    if (zoom === next) { viewportRef.current?.scrollTo({ left: 0, top: 0 }); pendingZoomAnchor.current = null }
    else setZoom(next)
  }

  return <section className={`map-panel plasma-map ${zoom < .016 ? 'distant-map' : ''}`} aria-label="Interactive multiverse timeline map">
    <div className="map-status-strip"><div><span className="live-dot" /><b>{showAll ? 'FULL ARCHIVE' : 'CURATED + CONNECTED'} · {stagedTitles.length} TITLES · {universeIds.length} TIMELINES</b></div><span>DRAG TO EXPLORE · PINCH OR CTRL / ⌘ + SCROLL TO ZOOM</span></div>
    <div ref={viewportRef} className={`map-viewport ${dragging ? 'dragging' : ''}`} onScroll={updateScroll} onPointerDown={onPointerDown}
      onPointerMove={moveDrag}
      onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={(event) => { if (event.target === event.currentTarget) stopDrag(event) }}
      onClickCapture={(event) => {
        if (event.detail > 0 && performance.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation() }
      }}>
      <MapScene layout={layout} routes={routes} selectedId={activeSelectionId} activeRouteId={activeRoute?.id || null} flowing={flowEnabled && !reducedMotion} onSelect={handleMapSelect} onRoute={setActiveRouteId} />
    </div>
    <div className="map-lane-captions" aria-hidden="true">
      {layout.lanes.map((lane) => <div key={lane.universeId} className="map-lane-caption" style={{ top: lane.trackY * zoom - scroll.top - 7, '--accent': timelineColor(lane.universeId, universeById.get(lane.universeId)!.color) } as CSSProperties}>
        <i /><span>{universeById.get(lane.universeId)!.shortName}<small>{lane.count} titles{['legacy', 'marvel-tv', 'animation', 'alternate'].includes(lane.universeId) ? ' · separate continuities' : ''}</small></span>
      </div>)}
    </div>
    {!stagedTitles.length && <div className="map-empty-state"><b>{universeIds.length ? 'No titles match these filters' : 'Choose a universe to explore'}</b><span>{universeIds.length ? 'Enable Show All Titles or another format in the sidebar.' : 'Use the universe switches in the left sidebar.'}</span></div>}
    {activeRoute && <div id="map-connection-detail" className="map-connection-detail" role="dialog" aria-labelledby="map-connection-heading">
      <button className="connection-detail-close" onClick={() => setActiveRouteId(null)} aria-label="Close connection explanation"><X size={13} /></button>
      <small>{activeRoute.type.replaceAll('-', ' ').toUpperCase()}</small>
      <h2 id="map-connection-heading">Why these titles connect</h2>
      <div>{[activeRoute.from, activeRoute.to].map((id, index) => {
        const title = titleById.get(id)!
        return <span key={id} className="connection-title-pair">
          {index > 0 && <ArrowRight size={14} aria-hidden="true" />}
          <button onClick={() => { onSelect(id); centerOn(id) }}>{title.title}<small>{universeById.get(title.universeId)!.name} · {title.year}</small></button>
        </span>
      })}</div>
      <p>{linkById.get(activeRoute.id)?.explanation}</p>
    </div>}
    <div className="map-bottom-controls">
      <div className="legend"><span><i className="legend-timeline" />Universe Timeline</span><span><i className="legend-branch" />Title Connection</span><span><i className="legend-time" />Time Travel</span></div>
      <div className="zoom-controls">
        <button className={`flow-toggle ${flowEnabled && !reducedMotion ? 'active' : ''}`} onClick={() => setFlowEnabled((value) => !value)} aria-label="Toggle flowing timeline glow" aria-pressed={flowEnabled && !reducedMotion} disabled={reducedMotion}><Waves size={14} />Flow {flowEnabled && !reducedMotion ? 'on' : 'off'}</button>
        <button onClick={() => changeZoom(zoom * .8)} aria-label="Zoom out" disabled={zoom <= MIN_ZOOM}><Minus size={14} /></button><span aria-live="polite">{zoom < .1 ? (zoom * 100).toFixed(1) : Math.round(zoom * 100)}%</span><button onClick={() => changeZoom(zoom / .8)} aria-label="Zoom in" disabled={zoom >= MAX_ZOOM}><Plus size={14} /></button>
        <button className="fit-button" onClick={() => resetView(OVERVIEW_ZOOM)} title="Readable overview; zoom out further to see the entire map"><Maximize2 size={13} />Overview</button>
        <button className="fit-all-button" onClick={() => resetView(fitMapZoom(makeMapLayout(stagedTitles, universeIds, OVERVIEW_ZOOM), viewportSize))} aria-label="Fit entire map" title="Fit every visible timeline in the viewport"><Scan size={14} /><span>Fit all</span></button>
      </div>
      {zoom < .7 && <span className="readable-zoom-note">{zoom < OVERVIEW_ZOOM ? 'Full-map scale · zoom in for titles' : 'Readable titles · pan for more'}</span>}
    </div>
    <div className="map-selection-actions">
      {selectedRouteIds.length > 0 && <button onClick={() => setActiveRouteId(selectedRouteIds[(selectedRouteIds.indexOf(activeRouteId || '') + 1) % selectedRouteIds.length])}>{selectedRouteIds.length} title connections <ArrowRight size={12} /></button>}
      <button onClick={() => centerOn(layout.positions.has(activeSelectionId) ? activeSelectionId : layout.positions.keys().next().value || '')} disabled={!activeSelectionId}><Crosshair size={14} />Selected</button>
    </div>
    <MapMinimap layout={geometryLayout} routes={routes} selectedId={activeSelectionId} viewport={{ left: scroll.left / zoom, top: scroll.top / zoom, width: viewportSize.width / zoom, height: viewportSize.height / zoom }} onNavigate={navigateMinimap} />
  </section>
}
