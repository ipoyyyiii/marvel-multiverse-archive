import { memo, useRef, type PointerEvent } from 'react'
import { universes } from './data/catalog'
import { routePath, type GraphLayout, type MapPoint, type MapRoute } from './mapGeometry'
import './mapMinimap.css'

interface MapMinimapProps {
  layout: GraphLayout
  routes: MapRoute[]
  viewport: { left: number; top: number; width: number; height: number }
  onNavigate: (point: MapPoint) => void
  selectedId?: string
}

const WIDTH = 224
const HEIGHT = 116
const PADDING_X = 9
const PADDING_Y = 10
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const MinimapStaticGeometry = memo(function MinimapStaticGeometry({
  layout,
  routes,
  scaleX,
  scaleY,
  selectedId,
}: {
  layout: GraphLayout
  routes: MapRoute[]
  scaleX: number
  scaleY: number
  selectedId?: string
}) {
  const point = (value: MapPoint) => ({ x: PADDING_X + value.x * scaleX, y: PADDING_Y + value.y * scaleY })
  const miniatureRoutes = routes.map((route) => {
    const project = (value: MapPoint) => ({ x: PADDING_X + value.x * scaleX, y: PADDING_Y + value.y * scaleY })
    return { ...route, d: routePath({ start: project(route.start), controlA: project(route.controlA), controlB: project(route.controlB), end: project(route.end) }) }
  })
  return <>
    {layout.lanes.map((lane) => {
      const tint = lane.universeId === 'mcu' ? '#fff' : universes.find((universe) => universe.id === lane.universeId)!.color
      const start = point({ x: lane.start, y: lane.trackY })
      const end = point({ x: lane.end, y: lane.trackY })
      return <line key={lane.universeId} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={tint} strokeWidth={lane.universeId === 'mcu' ? 2 : 1.4} strokeLinecap="round"><title>{universes.find((universe) => universe.id === lane.universeId)!.name}</title></line>
    })}
    {miniatureRoutes.map((route) => <path key={route.id} d={route.d} className={`archive-minimap-route ${route.from === selectedId || route.to === selectedId ? 'is-selected' : ''}`} />)}
    {[...layout.positions.values()].map((node) => {
      const position = point({ x: node.x, y: node.trackY })
      return <circle key={node.title.id} cx={position.x} cy={position.y} r={.8} fill="#e8edf6" opacity=".55" />
    })}
  </>
})

export default function MapMinimap({ layout, routes, viewport, onNavigate, selectedId }: MapMinimapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const scaleX = (WIDTH - PADDING_X * 2) / Math.max(layout.width, 1)
  const scaleY = (HEIGHT - PADDING_Y * 2) / Math.max(layout.height, 1)
  const selected = selectedId ? layout.positions.get(selectedId) : undefined
  const point = (value: MapPoint) => ({ x: PADDING_X + value.x * scaleX, y: PADDING_Y + value.y * scaleY })
  const left = clamp(viewport.left, 0, layout.width)
  const top = clamp(viewport.top, 0, layout.height)
  const right = clamp(viewport.left + viewport.width, left, layout.width)
  const bottom = clamp(viewport.top + viewport.height, top, layout.height)
  const viewportWidth = Math.max(3, (right - left) * scaleX)
  const viewportHeight = Math.max(3, (bottom - top) * scaleY)
  const viewportX = clamp(PADDING_X + left * scaleX, PADDING_X, WIDTH - PADDING_X - viewportWidth)
  const viewportY = clamp(PADDING_Y + top * scaleY, PADDING_Y, HEIGHT - PADDING_Y - viewportHeight)

  const navigate = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = svgRef.current?.getBoundingClientRect()
    if (!bounds) return
    onNavigate({
      x: clamp(((event.clientX - bounds.left) * WIDTH / bounds.width - PADDING_X) / scaleX, 0, layout.width),
      y: clamp(((event.clientY - bounds.top) * HEIGHT / bounds.height - PADDING_Y) / scaleY, 0, layout.height),
    })
  }

  return (
    <aside className="archive-minimap" aria-label="Multiverse map overview">
      <div className="archive-minimap-heading"><span>MAP OVERVIEW</span><span>{layout.lanes.length} UNIVERSES</span></div>
      <svg
        ref={svgRef}
        className="archive-minimap-canvas"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="application"
        tabIndex={0}
        aria-label="Map navigator. Click or drag to pan; arrow keys move the view."
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          dragging.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
          navigate(event)
        }}
        onPointerMove={(event) => { if (dragging.current) navigate(event) }}
        onPointerUp={(event) => {
          dragging.current = false
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={() => { dragging.current = false }}
        onLostPointerCapture={() => { dragging.current = false }}
        onKeyDown={(event) => {
          const delta: Record<string, MapPoint> = {
            ArrowLeft: { x: -viewport.width * .4, y: 0 },
            ArrowRight: { x: viewport.width * .4, y: 0 },
            ArrowUp: { x: 0, y: -viewport.height * .4 },
            ArrowDown: { x: 0, y: viewport.height * .4 },
          }
          if (!delta[event.key]) return
          event.preventDefault()
          onNavigate({
            x: clamp(viewport.left + viewport.width / 2 + delta[event.key].x, 0, layout.width),
            y: clamp(viewport.top + viewport.height / 2 + delta[event.key].y, 0, layout.height),
          })
        }}
      >
        <MinimapStaticGeometry layout={layout} routes={routes} scaleX={scaleX} scaleY={scaleY} selectedId={selectedId} />
        <rect className="archive-minimap-viewport" x={viewportX} y={viewportY} width={viewportWidth} height={viewportHeight} rx="1.5" />
        {selected && <circle className="archive-minimap-selected" cx={point({ x: selected.x, y: selected.trackY }).x} cy={point({ x: selected.x, y: selected.trackY }).y} r="3" />}
      </svg>
      <div className="archive-minimap-hint">CLICK OR DRAG TO NAVIGATE</div>
    </aside>
  )
}
