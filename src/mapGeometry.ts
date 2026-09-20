import type { Connection, ConnectionType, MarvelTitle, UniverseId } from './data/catalog'

export const NODE_WIDTH = 216
export const NODE_HEIGHT = 118
export const MIN_ZOOM = .002
export const OVERVIEW_ZOOM = .22
export const MAX_ZOOM = 1.15

export const MAP_UNIVERSE_ORDER: UniverseId[] = [
  'legacy', 'marvel-tv', 'defenders', 'fox', 'raimi',
  'mcu',
  'amazing', 'sony', 'animation', 'alternate',
]

export interface MapPoint { x: number; y: number }

export interface NodePosition {
  x: number
  y: number
  trackY: number
  side: 'above' | 'below'
  spineKey: UniverseId
  title: MarvelTitle
  scale: number
}

export interface LaneLayout {
  universeId: UniverseId
  y: number
  height: number
  trackY: number
  start: number
  end: number
  tracks: string[]
  count: number
  collapsed: false
}

export interface GraphLayout {
  positions: Map<string, NodePosition>
  lanes: LaneLayout[]
  width: number
  height: number
  zoom: number
  nodeScale: number
  nodeStep: number
}

export interface MapRoute {
  id: string
  from: string
  to: string
  type: ConnectionType
  d: string
  start: MapPoint
  controlA: MapPoint
  controlB: MapPoint
  end: MapPoint
}

export const clampMapZoom = (zoom: number) => Number.isFinite(zoom)
  ? Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
  : 1

/** Below Overview, freeze spacing and artwork sizes so the whole map can shrink. */
export const nodeScaleForZoom = (zoom: number) => {
  const value = Math.max(OVERVIEW_ZOOM, clampMapZoom(zoom))
  return Math.max(.82, value) / value
}

/**
 * This is a relationship map, not a date axis. Every title advances one slot;
 * alternate slots sit above and below a single universe spine.
 */
export function makeMapLayout(
  titles: MarvelTitle[],
  universeIds: UniverseId[],
  requestedZoom: number,
): GraphLayout {
  const zoom = clampMapZoom(requestedZoom)
  const spacingZoom = Math.max(OVERVIEW_ZOOM, zoom)
  const nodeScale = nodeScaleForZoom(zoom)
  const nodeStep = Math.max(144, 104 / spacingZoom)
  const laneHeight = Math.max(360, 304 / spacingZoom)
  const laneGap = Math.max(56, 48 / spacingZoom)
  const scenePadding = Math.max(90, 64 / spacingZoom)
  const titleInset = Math.max(92, 74 / spacingZoom)
  const titleWidth = NODE_WIDTH * nodeScale
  const titleHeight = NODE_HEIGHT * nodeScale
  const stemHeight = Math.max(30, 28 / spacingZoom)
  const firstX = scenePadding + titleInset + titleWidth / 2
  const laneIds = [...new Set(universeIds)]
  const visibleUniverses = new Set(laneIds)
  const laneTitles = new Map<UniverseId, MarvelTitle[]>(laneIds.map((id) => [id, []]))
  const assignedIds = new Set<string>()

  for (const title of titles) {
    if (assignedIds.has(title.id)) continue
    // A title displayed through an alias still occupies only one lane. Prefer
    // its native lane whenever that lane is enabled.
    const laneId = visibleUniverses.has(title.universeId)
      ? title.universeId
      : laneIds.find((id) => title.viewUniverseIds?.includes(id))
    if (!laneId) continue
    laneTitles.get(laneId)!.push(title)
    assignedIds.add(title.id)
  }

  const maxTitles = Math.max(1, ...[...laneTitles.values()].map((items) => items.length))
  const width = Math.max(
    1180,
    860 / spacingZoom,
    firstX + (maxTitles - 1) * nodeStep + titleWidth / 2 + titleInset + scenePadding,
  )
  const positions = new Map<string, NodePosition>()
  const lanes: LaneLayout[] = []
  let laneY = scenePadding

  for (const universeId of laneIds) {
    const items = laneTitles.get(universeId)!
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate)
        || a.title.localeCompare(b.title)
        || a.id.localeCompare(b.id))
    const trackY = laneY + laneHeight / 2
    lanes.push({
      universeId,
      y: laneY,
      height: laneHeight,
      trackY,
      start: scenePadding,
      end: width - scenePadding,
      tracks: [universeId],
      count: items.length,
      collapsed: false,
    })

    items.forEach((title, index) => {
      const side = index % 2 === 0 ? 'above' : 'below'
      positions.set(title.id, {
        x: firstX + index * nodeStep,
        y: side === 'above' ? trackY - stemHeight - titleHeight : trackY + stemHeight,
        trackY,
        side,
        spineKey: universeId,
        title,
        scale: nodeScale,
      })
    })
    laneY += laneHeight + laneGap
  }

  return {
    positions,
    lanes,
    width,
    height: lanes.length ? laneY - laneGap + scenePadding : 480 / spacingZoom,
    zoom,
    nodeScale,
    nodeStep,
  }
}

/** Keep a point between the same title slots/lanes as semantic zoom reflows. */
export function reprojectMapPoint(point: MapPoint, from: GraphLayout, to: GraphLayout): MapPoint {
  const fromNode = from.positions.values().next().value
  const toNode = to.positions.values().next().value
  const fromLane = from.lanes[0]
  const toLane = to.lanes[0]
  const fromStride = from.lanes[1] ? from.lanes[1].trackY - fromLane.trackY : fromLane?.height
  const toStride = to.lanes[1] ? to.lanes[1].trackY - toLane.trackY : toLane?.height
  return {
    x: fromNode && toNode
      ? toNode.x + (point.x - fromNode.x) * to.nodeStep / from.nodeStep
      : point.x * to.width / from.width,
    y: fromLane && toLane && fromStride && toStride
      ? toLane.trackY + (point.y - fromLane.trackY) * toStride / fromStride
      : point.y * to.height / from.height,
  }
}

/** Pass the Overview layout, whose world dimensions stay fixed at lower zoom. */
export function fitMapZoom(layout: GraphLayout, viewport: { width: number; height: number }): number {
  return clampMapZoom(Math.min(OVERVIEW_ZOOM,
    Math.max(1, viewport.width - 32) / layout.width,
    Math.max(1, viewport.height - 100) / layout.height,
  ))
}

const coordinate = (value: number) => Number(value.toFixed(3))

/** Shared cubic geometry makes the main map and minimap agree exactly. */
export const routePath = ({ start, controlA, controlB, end }: Pick<MapRoute, 'start' | 'controlA' | 'controlB' | 'end'>) => (
  `M ${coordinate(start.x)} ${coordinate(start.y)} C ${coordinate(controlA.x)} ${coordinate(controlA.y)}, ${coordinate(controlB.x)} ${coordinate(controlB.y)}, ${coordinate(end.x)} ${coordinate(end.y)}`
)

export function routeMapConnections(connections: Connection[], layout: GraphLayout): MapRoute[] {
  const routes: MapRoute[] = []
  const seenIds = new Set<string>()
  const fanFrom = new Map<string, number>()
  const fanTo = new Map<string, number>()
  const spacingZoom = Math.max(OVERVIEW_ZOOM, layout.zoom)
  const clampX = (x: number) => Math.max(32 / spacingZoom, Math.min(layout.width - 32 / spacingZoom, x))
  const clampY = (y: number) => Math.max(24 / spacingZoom, Math.min(layout.height - 24 / spacingZoom, y))

  for (const connection of [...connections].sort((a, b) => a.id.localeCompare(b.id))) {
    if (seenIds.has(connection.id)) continue
    const from = layout.positions.get(connection.from)
    const to = layout.positions.get(connection.to)
    if (!from || !to || from.title.id === to.title.id) continue
    seenIds.add(connection.id)
    const start = { x: from.x, y: from.trackY }
    const end = { x: to.x, y: to.trackY }
    const seed = [...connection.id].reduce((total, character) => total + character.charCodeAt(0), 0)
    const slot = seed % 4
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    let controlA: MapPoint
    let controlB: MapPoint

    if (from.spineKey === to.spineKey) {
      // Same-lane continuations ride the spine itself: the lane order already
      // tells that story, so drawing a parallel curve only adds spaghetti.
      // Only time travel/reset gets a visible arc — the one case where the
      // relationship is NOT "the next slot on this lane".
      if (connection.type !== 'time-travel' && connection.type !== 'timeline-reset') continue
      const arcDirection = seed % 2 ? -1 : 1
      const arcHeight = (108 + slot * 12) / spacingZoom
      const arcY = clampY(start.y + arcDirection * arcHeight)
      controlA = { x: start.x + deltaX * .22, y: arcY }
      controlB = { x: start.x + deltaX * .78, y: arcY }
    } else if (Math.abs(deltaX) < 190 / spacingZoom) {
      // Nearby columns need a side corridor instead of a vertical connection
      // hiding inside the title's stem and artwork.
      const direction = (start.x + end.x) / 2 < layout.width / 2 ? 1 : -1
      const corridor = clampX((start.x + end.x) / 2 + direction * (148 + slot * 18) / spacingZoom)
      controlA = { x: corridor, y: start.y + deltaY * .12 }
      controlB = { x: corridor, y: end.y - deltaY * .12 }
    } else {
      // A horizontal tangent grows from each title's exact junction on the
      // spine, then bends through the space between universe lanes.
      // Fans sharing one endpoint (e.g. every NWH or D&W link) each get
      // their own lateral offset so overlapping curves separate instead of
      // sitting on top of each other.
      const fanA = fanFrom.get(connection.from) ?? 0
      fanFrom.set(connection.from, fanA + 1)
      const fanB = fanTo.get(connection.to) ?? 0
      fanTo.set(connection.to, fanB + 1)
      const fanSpread = 30 / spacingZoom
      controlA = { x: clampX(start.x + deltaX * (.29 + slot * .025) + fanA * fanSpread), y: start.y }
      controlB = { x: clampX(end.x - deltaX * (.29 + slot * .025) - fanB * fanSpread), y: end.y }
    }

    const geometry = { start, controlA, controlB, end }
    routes.push({
      id: connection.id,
      from: connection.from,
      to: connection.to,
      type: connection.type,
      ...geometry,
      d: routePath(geometry),
    })
  }

  return routes
}
