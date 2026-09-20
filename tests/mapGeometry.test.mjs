import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { transformWithOxc } from 'vite'

// Use the repository's Vite transformer so this suite also runs on Node 20.
// The geometry and catalog modules have no runtime imports or browser globals.
async function importTypeScript(relativePath) {
  const url = new URL(relativePath, import.meta.url)
  let source = await readFile(url, 'utf8')
  // Catalog is also consumed directly from a data URL in this Node-only suite;
  // inline the generated manifest so its relative TS import remains resolvable.
  if (source.includes("from './logoManifest'")) {
    const manifestUrl = new URL('../src/data/logoManifest.ts', import.meta.url)
    const manifestSource = await readFile(manifestUrl, 'utf8')
    const literal = manifestSource.match(/export const logoManifest[^=]*= (\{[\s\S]*?\n\})/)?.[1] || '{}'
    source = source.replace(/import \{ logoManifest \} from '\.\/logoManifest'\s*/g, `const logoManifest = ${literal}\n`)
  }
  if (source.includes("from './synopses'")) {
    const synopsesUrl = new URL('../src/data/synopses.ts', import.meta.url)
    const synopsesSource = await readFile(synopsesUrl, 'utf8')
    const literal = synopsesSource.match(/export const synopses[^=]*= (\{[\s\S]*?\n\})/)?.[1] || '{}'
    source = source.replace(/import \{ synopses \} from '\.\/synopses'\s*/g, `const synopses = ${literal}\n`)
  }
  const { code } = await transformWithOxc(source, url.pathname)
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
}

const geometry = await importTypeScript('../src/mapGeometry.ts')
const { catalog, connections } = await importTypeScript('../src/data/catalog.ts')
const { selectMapTitles } = await importTypeScript('../src/mapSelection.ts')
const {
  MAP_UNIVERSE_ORDER,
  MAX_ZOOM,
  MIN_ZOOM,
  OVERVIEW_ZOOM,
  NODE_HEIGHT,
  NODE_WIDTH,
  makeMapLayout,
  nodeScaleForZoom,
  routeMapConnections,
  fitMapZoom,
  reprojectMapPoint,
} = geometry

const zoomLevels = [MIN_ZOOM, .01, .08, OVERVIEW_ZOOM, .28, .5, .82, 1, MAX_ZOOM]
const allFormats = new Set(['Film', 'Series', 'Special', 'Short'])
const selectedId = catalog.find((title) => title.title === 'Spider-Man: No Way Home').id

function assertFiniteLayout(layout) {
  for (const key of ['width', 'height', 'zoom', 'nodeScale', 'nodeStep']) {
    assert.ok(Number.isFinite(layout[key]) && layout[key] > 0, `Invalid ${key}: ${layout[key]}`)
  }
  for (const lane of layout.lanes) {
    for (const key of ['y', 'height', 'trackY', 'start', 'end']) {
      assert.ok(Number.isFinite(lane[key]), `Invalid lane ${lane.universeId}.${key}`)
    }
    assert.ok(lane.end > lane.start, `Empty spine in ${lane.universeId}`)
    assert.ok(lane.trackY > lane.y && lane.trackY < lane.y + lane.height)
  }
  for (const node of layout.positions.values()) {
    for (const key of ['x', 'y', 'trackY', 'scale']) {
      assert.ok(Number.isFinite(node[key]), `Invalid node ${node.title.id}.${key}`)
    }
    const lane = layout.lanes.find((item) => item.universeId === node.spineKey)
    assert.ok(lane, `Missing spine for ${node.title.id}`)
    assert.equal(node.trackY, lane.trackY)
    assert.ok(node.x - NODE_WIDTH * node.scale / 2 > lane.start, `${node.title.id} touches the left beam edge`)
    assert.ok(node.x + NODE_WIDTH * node.scale / 2 < lane.end, `${node.title.id} touches the right beam edge`)
  }
}

function assertRoutesAnchored(layout, routes) {
  for (const route of routes) {
    const from = layout.positions.get(route.from)
    const to = layout.positions.get(route.to)
    assert.ok(from && to, `${route.id} has a missing title endpoint`)
    assert.deepEqual(route.start, { x: from.x, y: from.trackY }, `${route.id} leaves the wrong title junction`)
    assert.deepEqual(route.end, { x: to.x, y: to.trackY }, `${route.id} arrives at the wrong title junction`)
    assert.ok(!/NaN|Infinity|undefined/.test(route.d), `Invalid path: ${route.id}`)
    for (const point of [route.start, route.controlA, route.controlB, route.end]) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y), `Invalid control point: ${route.id}`)
    }
    const coordinates = route.d.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)?.map(Number)
    assert.ok(coordinates?.length >= 4, `Missing path geometry: ${route.id}`)
    assert.ok(Math.abs(coordinates[0] - from.x) < .02 && Math.abs(coordinates[1] - from.trackY) < .02)
    assert.ok(Math.abs(coordinates.at(-2) - to.x) < .02 && Math.abs(coordinates.at(-1) - to.trackY) < .02)
  }
}

test('the full archive has one full-length spine per universe and no duplicate titles', () => {
  const layout = makeMapLayout(catalog, MAP_UNIVERSE_ORDER, .82)
  assert.equal(layout.lanes.length, MAP_UNIVERSE_ORDER.length)
  assert.equal(new Set(layout.lanes.map((lane) => lane.universeId)).size, MAP_UNIVERSE_ORDER.length)
  assert.equal(layout.positions.size, new Set(catalog.map((title) => title.id)).size)
  const ends = new Set(layout.lanes.map((lane) => `${lane.start}:${lane.end}`))
  assert.equal(ends.size, 1, 'All visible universe spines must span the complete map')
  assertFiniteLayout(layout)
})

test('single-universe Fox view keeps Deadpool & Wolverine on the same single spine', () => {
  const layout = makeMapLayout(catalog, ['fox'], .28)
  const alias = catalog.find((title) => title.title === 'Deadpool & Wolverine')
  assert.ok(alias?.viewUniverseIds?.includes('fox'), 'Expected the actual Fox catalog alias')
  assert.equal(layout.lanes.length, 1)
  assert.equal(layout.lanes[0].universeId, 'fox')
  assert.ok(layout.positions.has(alias.id))
  for (const node of layout.positions.values()) assert.equal(node.spineKey, 'fox')
  assertFiniteLayout(layout)
})

test('alias titles stay on their native spine when both universe views are visible', () => {
  const layout = makeMapLayout(catalog, ['fox', 'mcu'], .82)
  const alias = catalog.find((title) => title.title === 'Deadpool & Wolverine')
  assert.equal(layout.positions.get(alias.id)?.spineKey, 'mcu')
  assert.equal(layout.lanes.length, 2)
  assertFiniteLayout(layout)
})

test('curated subsets and zero-title universe filters retain continuous spines', () => {
  const curated = selectMapTitles(catalog, connections, {
    universeIds: MAP_UNIVERSE_ORDER, showAll: false, selectedId, formats: allFormats,
  })
  for (const titles of [curated, [], curated.slice(0, 1)]) {
    const layout = makeMapLayout(titles, MAP_UNIVERSE_ORDER, .28)
    assert.equal(layout.lanes.length, MAP_UNIVERSE_ORDER.length)
    assertFiniteLayout(layout)
    assertRoutesAnchored(layout, routeMapConnections(connections, layout))
  }
})

test('turning Show All Titles off preserves eligible crossover endpoints and the selected title', () => {
  const options = { universeIds: MAP_UNIVERSE_ORDER, showAll: false, selectedId, formats: allFormats }
  const curated = selectMapTitles(catalog, connections, options)
  const ids = new Set(curated.map((title) => title.id))
  const seeds = new Set(catalog.filter((title) => title.featured || title.id === selectedId).map((title) => title.id))
  assert.ok(curated.length < catalog.length, 'Curated mode must reduce the displayed catalog')
  assert.ok(ids.has(selectedId))
  for (const connection of connections) {
    if (connection.type !== 'direct-sequel' && (seeds.has(connection.from) || seeds.has(connection.to))) {
      assert.ok(ids.has(connection.from) && ids.has(connection.to), `Curated mode drops ${connection.id}`)
    }
  }
  const layout = makeMapLayout(curated, MAP_UNIVERSE_ORDER, .28)
  const routes = routeMapConnections(connections, layout)
  for (const id of ['nwh-raimi', 'nwh-amazing', 'nwh-venom', 'elektra-dpw']) {
    assert.ok(routes.some((route) => route.id === id), `Curated map lost ${id}`)
  }
  assertRoutesAnchored(layout, routes)
  const all = selectMapTitles(catalog, connections, { ...options, showAll: true })
  assert.equal(all.length, catalog.length, 'Re-enabling Show All Titles must restore the full catalog')
})

test('format and universe filters constrain curated endpoint expansion', () => {
  for (const universeIds of [['fox'], ['mcu'], ['mcu', 'raimi'], MAP_UNIVERSE_ORDER]) {
    for (const formats of [new Set(['Film']), new Set(['Series']), new Set()]) {
      const titles = selectMapTitles(catalog, connections, { universeIds, showAll: false, selectedId, formats })
      for (const title of titles) {
        assert.ok(formats.has(title.format), `Curated expansion bypassed the ${title.format} filter`)
        assert.ok(universeIds.includes(title.universeId) || (universeIds.length === 1 && title.viewUniverseIds?.includes(universeIds[0])))
      }
      const layout = makeMapLayout(titles, universeIds, .28)
      assertFiniteLayout(layout)
      assertRoutesAnchored(layout, routeMapConnections(connections, layout))
    }
  }
})

test('successive titles advance horizontally while alternating above and below', () => {
  const layout = makeMapLayout(catalog, MAP_UNIVERSE_ORDER, .28)
  for (const lane of layout.lanes) {
    const nodes = [...layout.positions.values()].filter((node) => node.spineKey === lane.universeId)
    const sorted = [...nodes].sort((a, b) => a.title.releaseDate.localeCompare(b.title.releaseDate) || a.title.title.localeCompare(b.title.title))
    sorted.forEach((node, index) => {
      assert.equal(node.side, index % 2 === 0 ? 'above' : 'below')
      if (index > 0) assert.ok(node.x > sorted[index - 1].x, `${node.title.id} shares the previous title's column`)
    })
  }
})

test('logos stay legible at Overview and never overlap, including at full-map scale', () => {
  for (const zoom of zoomLevels) {
    const layout = makeMapLayout(catalog, MAP_UNIVERSE_ORDER, zoom)
    assertFiniteLayout(layout)
    const nodes = [...layout.positions.values()]
    if (zoom >= OVERVIEW_ZOOM) assert.ok(NODE_WIDTH * nodeScaleForZoom(zoom) * zoom >= 175, `Logos are too small at ${zoom}`)
    for (let index = 0; index < nodes.length; index += 1) {
      const a = nodes[index]
      const aWidth = NODE_WIDTH * a.scale
      const aHeight = NODE_HEIGHT * a.scale
      for (const b of nodes.slice(index + 1)) {
        const bWidth = NODE_WIDTH * b.scale
        const bHeight = NODE_HEIGHT * b.scale
        const overlapX = Math.abs(a.x - b.x) < (aWidth + bWidth) / 2
        const overlapY = a.y < b.y + bHeight && b.y < a.y + aHeight
        assert.ok(!(overlapX && overlapY), `${a.title.id} overlaps ${b.title.id} at ${zoom}`)
      }
    }
  }
})

test('below Overview, titles, spines and branches shrink together without further reflow', () => {
  const overview = makeMapLayout(catalog, MAP_UNIVERSE_ORDER, OVERVIEW_ZOOM)
  const overviewRoutes = routeMapConnections(connections, overview)
  for (const zoom of [.1, .02, MIN_ZOOM]) {
    const layout = makeMapLayout(catalog, MAP_UNIVERSE_ORDER, zoom)
    assert.equal(layout.width, overview.width)
    assert.equal(layout.height, overview.height)
    assert.deepEqual(layout.positions, overview.positions)
    assert.deepEqual(routeMapConnections(connections, layout), overviewRoutes)
    assert.ok(layout.width * zoom < overview.width * OVERVIEW_ZOOM)
    assert.ok(layout.height * zoom < overview.height * OVERVIEW_ZOOM)
  }
})

test('Fit All accommodates the full archive, a single universe and curated titles on phones and desktops', () => {
  for (const universeIds of [MAP_UNIVERSE_ORDER, ['mcu'], ['fox'], ['raimi'], []]) {
    for (const showAll of [true, false]) {
      const titles = selectMapTitles(catalog, connections, { universeIds, showAll, selectedId, formats: allFormats })
      const overview = makeMapLayout(titles, universeIds, OVERVIEW_ZOOM)
      for (const viewport of [{ width: 320, height: 400 }, { width: 390, height: 600 }, { width: 1400, height: 800 }]) {
        const zoom = fitMapZoom(overview, viewport)
        const layout = makeMapLayout(titles, universeIds, zoom)
        assert.ok(layout.width * zoom <= viewport.width - 32 + .01)
        assert.ok(layout.height * zoom <= viewport.height - 100 + .01)
        assert.equal(layout.positions.size, overview.positions.size, 'Fitting must not hide titles')
      }
    }
  }
})

test('pinch anchors follow the same title junction through readable zoom and full-map scale', () => {
  for (const universeIds of [MAP_UNIVERSE_ORDER, ['fox']]) {
    for (const startZoom of [.88, OVERVIEW_ZOOM, .01]) {
      const start = makeMapLayout(catalog, universeIds, startZoom)
      for (const endZoom of [.95, .4, .1, .01]) {
        const end = makeMapLayout(catalog, universeIds, endZoom)
        for (const [id, node] of start.positions) {
          const projected = reprojectMapPoint({ x: node.x, y: node.trackY }, start, end)
          const nextNode = end.positions.get(id)
          assert.ok(Math.abs(projected.x - nextNode.x) < .0001, `Pinch drift in ${id} x`)
          assert.ok(Math.abs(projected.y - nextNode.trackY) < .0001, `Pinch drift in ${id} y`)
        }
      }
    }
  }
})

test('all supported connections terminate at the exact source and target title beam junctions', () => {
  for (const zoom of [MIN_ZOOM, .28, .82, MAX_ZOOM]) {
    const layout = makeMapLayout(catalog, MAP_UNIVERSE_ORDER, zoom)
    const routes = routeMapConnections(connections, layout)
    assert.ok(routes.length > 0)
    assert.ok(routes.some((route) => route.id === 'nwh-raimi'))
    assert.ok(routes.some((route) => route.id === 'nwh-amazing'))
    assert.ok(routes.some((route) => route.type === 'timeline-reset'))
    assertRoutesAnchored(layout, routes)
  }
})

test('routes with absent endpoints are omitted without invalid geometry', () => {
  const layout = makeMapLayout(catalog, ['raimi'], .28)
  const routes = routeMapConnections(connections, layout)
  assert.ok(routes.every((route) => layout.positions.has(route.from) && layout.positions.has(route.to)))
  assert.ok(!routes.some((route) => route.id === 'nwh-raimi'))
  assertRoutesAnchored(layout, routes)
  const empty = makeMapLayout([], [], .28)
  assertFiniteLayout(empty)
  assert.deepEqual(routeMapConnections(connections, empty), [])
})
