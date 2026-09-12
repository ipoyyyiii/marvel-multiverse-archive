import { memo, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from 'react'
import './plasma.css'

// Color identifies the universe. Moving highlights remain white on every beam.
export const timelineColor = (universeId: string, color: string) => universeId === 'mcu' ? '#ffffff' : color
export const streamColor = (_universeId: string) => '#ffffff'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}

type EnergyViewport = { left: number; right: number; top: number; bottom: number }

interface EnergySpineProps {
  id: string
  universeId: string
  color: string
  start: number
  end: number
  y: number
  zoom: number
  // Kept for existing callers. Static geometry always covers the entire spine.
  viewport?: EnergyViewport
  flowing: boolean
  renderStreams?: boolean
  /** Chronological views reuse the same beam rotated onto a vertical axis. */
  orientation?: 'horizontal' | 'vertical'
}

const svgId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '-')

/**
 * One straight trunk with a fixed-cost plasma envelope. The wisps are a tiny
 * repeating SVG pattern, not extra relationships or a filtered map-sized image.
 * Nothing here depends on pan position, and no SVG attribute is animated.
 */
export const EnergySpine = memo(function EnergySpine({ id, universeId, color, start, end, y, zoom, orientation = 'horizontal' }: EnergySpineProps) {
  const mcu = universeId === 'mcu'
  const tint = timelineColor(universeId, color)
  const scale = Math.max(.08, zoom)
  const width = Math.max(0, end - start)
  const height = (mcu ? 64 : 52) / scale
  const coreWidth = (mcu ? 8 : 6.4) / scale
  const key = svgId(id)
  if (!width) return null

  return (
    <g
      className={`universe-spine plasma-spine ${mcu ? 'plasma-spine-mcu' : ''}`}
      data-universe={universeId}
      transform={orientation === 'vertical' ? `rotate(90 ${y} ${y})` : undefined}
    >
      <defs>
        <linearGradient id={`${key}-envelope`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={tint} stopOpacity="0" />
          <stop offset=".16" stopColor={tint} stopOpacity=".018" />
          <stop offset=".34" stopColor={tint} stopOpacity=".1" />
          <stop offset=".43" stopColor={tint} stopOpacity=".3" />
          <stop offset=".5" stopColor={tint} stopOpacity=".65" />
          <stop offset=".57" stopColor={tint} stopOpacity=".3" />
          <stop offset=".66" stopColor={tint} stopOpacity=".1" />
          <stop offset=".84" stopColor={tint} stopOpacity=".018" />
          <stop offset="1" stopColor={tint} stopOpacity="0" />
        </linearGradient>
        <pattern id={`${key}-wisps`} x={start} y={y - height / 2} width={512 / scale} height={height} patternUnits="userSpaceOnUse" viewBox="0 0 512 64" preserveAspectRatio="none">
          <g fill="none" stroke={tint} strokeLinecap="round" strokeLinejoin="round">
            <path d="M0 30 C30 24 57 41 88 31 S148 19 181 30 S245 40 284 29 S354 22 395 30 S462 38 512 29" strokeWidth="1.05" opacity=".65" />
            <path d="M0 36 C38 43 72 25 116 35 S181 44 226 34 S302 28 347 36 S424 42 468 32 S495 31 512 36" strokeWidth=".8" opacity=".45" />
            <path d="M0 26 C31 15 56 40 88 24 S144 15 180 25 S236 17 282 27 S350 13 392 24 S461 17 512 25" strokeWidth=".65" opacity=".28" />
            <path d="M0 42 C34 30 66 51 106 42 S168 33 210 43 S274 48 316 40 S384 31 428 42 S482 47 512 40" strokeWidth=".55" opacity=".22" />

            {/* Short, pre-baked forks make the beam edge feel electrical without a noise filter. */}
            <g className="plasma-fractal-wisps">
              <path className="plasma-fractal-strong" d="M39 29 C32 25 28 21 24 17 C20 14 17 10 12 8 M111 29 C105 25 101 21 98 16 C95 12 91 9 87 5 M190 28 C194 24 198 21 199 16 C200 11 204 9 208 6 M286 31 C294 27 298 22 302 17 C306 13 311 10 315 6 M374 28 C368 24 365 20 361 15 C358 11 354 9 350 5 M452 31 C460 27 463 22 467 17 C470 13 475 10 479 6" strokeWidth=".78" opacity=".42" />
              <path className="plasma-fractal-strong" d="M70 35 C64 39 60 43 58 48 C56 52 52 55 49 59 M145 35 C151 39 154 43 157 48 C160 52 164 55 169 59 M235 34 C229 39 226 43 224 48 C222 52 218 55 214 59 M328 35 C334 39 337 43 340 48 C343 52 347 55 351 59 M411 34 C405 39 402 43 400 48 C398 52 394 55 390 59 M488 35 C494 39 498 43 500 48 C502 52 506 55 510 58" strokeWidth=".72" opacity=".36" />

              <path className="plasma-fractal-branch" d="M24 17 C29 16 32 13 35 9 M98 16 C93 17 90 14 86 12 M199 16 C205 18 210 17 214 14 M302 17 C307 18 312 16 316 12 M361 15 C356 16 352 14 348 11 M467 17 C472 18 477 16 482 12" strokeWidth=".43" opacity=".26" />
              <path className="plasma-fractal-branch" d="M58 48 C63 47 67 49 71 52 M157 48 C152 47 148 49 144 52 M224 48 C219 47 215 49 211 52 M340 48 C345 47 349 49 353 52 M400 48 C395 47 391 49 387 52 M500 48 C505 47 509 49 512 51" strokeWidth=".4" opacity=".24" />

              <path className="plasma-fractal-fine" d="M31 22 L27 19 L25 14 L21 12 M44 27 L47 23 L45 19 M105 23 L109 19 L108 14 L112 11 M177 25 L174 21 L176 17 M208 21 L212 18 L211 13 M276 28 L279 24 L277 20 L281 16 M324 24 L328 20 L326 15 M389 24 L386 20 L389 16 M438 26 L442 22 L440 18 M476 23 L480 20 L478 15 M68 41 L64 45 L66 49 M129 39 L126 43 L129 47 M184 41 L188 45 L185 50 M253 39 L256 43 L253 47 M306 41 L302 45 L305 49 M365 40 L369 44 L366 48 M422 40 L418 44 L421 48 M467 40 L470 44 L468 49" strokeWidth=".24" opacity=".32" />
            </g>
          </g>
          <path d="M0 31 C28 26 63 35 95 30 S155 32 192 31 S266 28 298 32 S366 27 414 31 S474 28 512 31" fill="none" stroke="#fff" strokeWidth=".8" opacity=".5" />
        </pattern>
      </defs>
      <rect className="plasma-envelope" x={start} y={y - height / 2} width={width} height={height} fill={`url(#${key}-envelope)`} />
      <line className="plasma-sheath" x1={start} x2={end} y1={y} y2={y} stroke={tint} strokeWidth={coreWidth * 2} />
      <line className="plasma-core" x1={start} x2={end} y1={y} y2={y} stroke={tint} strokeWidth={coreWidth} />
      <rect className="plasma-wisps" x={start} y={y - height / 2} width={width} height={height} fill={`url(#${key}-wisps)`} />
      <line className="plasma-heart" x1={start} x2={end} y1={y} y2={y} stroke="#fff" strokeWidth={(mcu ? 2.1 : 1.15) / scale} />
    </g>
  )
}, (previous, next) => previous.id === next.id && previous.universeId === next.universeId && previous.color === next.color && previous.start === next.start && previous.end === next.end && previous.y === next.y && previous.zoom === next.zoom && previous.orientation === next.orientation)

export interface FlowSpine {
  id: string
  universeId: string
  start: number
  end: number
  y: number
  streamColor: string
  seed: number
}

export interface FlowBranch {
  id: string
  start: { x: number; y: number }
  controlA: { x: number; y: number }
  controlB: { x: number; y: number }
  end: { x: number; y: number }
  seed: number
}

// All lanes share one visibility listener. Pausing preserves the CSS animation
// phase, so returning to the tab or toggling Flow never restarts every current.
const visibilityListeners = new Set<() => void>()
const reportVisibility = () => visibilityListeners.forEach((listener) => listener())
const subscribeVisibility = (listener: () => void) => {
  if (!visibilityListeners.size) document.addEventListener('visibilitychange', reportVisibility)
  visibilityListeners.add(listener)
  return () => {
    visibilityListeners.delete(listener)
    if (!visibilityListeners.size) document.removeEventListener('visibilitychange', reportVisibility)
  }
}
const pageIsVisible = () => !document.hidden
const serverPageIsVisible = () => true

interface TimelineFlowPulseProps {
  spine: FlowSpine
  zoom: number
  flowing?: boolean
  viewport?: { left: number; top: number }
  viewportWidth?: number
  orientation?: 'horizontal' | 'vertical'
}

/**
 * Mount inside .world-scene, next to graph-lines, and keep mounted when paused.
 * Two short compositor-only highlights travel across the already-static trunk.
 * The pulse layers stay small even when the archive is zoomed out to its full
 * width, so a very long timeline never becomes a giant animated bitmap.
 */
export const TimelineFlowPulse = memo(function TimelineFlowPulse({ spine, zoom, flowing = true, orientation = 'horizontal' }: TimelineFlowPulseProps) {
  const visible = useSyncExternalStore(subscribeVisibility, pageIsVisible, serverPageIsVisible)
  const scale = Math.max(.08, zoom)
  const vertical = orientation === 'vertical'
  const pulseLength = Math.min(520, Math.max(280, 360 / scale))
  const pulseThickness = 17 / scale
  const distance = Math.max(0, spine.end - spine.start - pulseLength)
  const seeds = [spine.seed % 17, (spine.seed + 9) % 17]
  return (
    <>
      {seeds.map((seed, index) => <span
        key={`${spine.id}-pulse-${index}`}
        className={`plasma-flow-pulse ${vertical ? 'vertical' : ''}`}
        data-flowing={flowing && visible}
        data-universe={spine.universeId}
        aria-hidden="true"
        style={{
          left: vertical ? spine.y - pulseThickness / 2 : spine.start,
          top: vertical ? spine.start : spine.y - pulseThickness / 2,
          width: vertical ? pulseThickness : pulseLength,
          height: vertical ? pulseLength : pulseThickness,
          '--plasma-flow-distance': `${distance}px`,
          '--plasma-flow-duration': `${14 + ((spine.seed + index * 3) % 7)}s`,
          '--plasma-flow-delay': `-${seed}s`,
        } as CSSProperties}
      />)}
    </>
  )
}, (previous, next) => previous.zoom === next.zoom && previous.flowing === next.flowing && previous.orientation === next.orientation && previous.spine.id === next.spine.id && previous.spine.start === next.spine.start && previous.spine.end === next.spine.end && previous.spine.y === next.spine.y && previous.spine.seed === next.spine.seed && previous.spine.universeId === next.spine.universeId)

interface EnergyBranchProps {
  id: string
  from: string
  to: string
  d: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  sourceColor: string
  targetColor: string
  highlighted: boolean
  zoom: number
  flowing: boolean
  viewport?: EnergyViewport
}

function branchFilament(d: string, strand: number, zoom: number) {
  const points = d.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)?.map(Number)
  if (!points || points.length !== 8) return d
  const steps = 48
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps
    const u = 1 - t
    const x = u ** 3 * points[0] + 3 * u ** 2 * t * points[2] + 3 * u * t ** 2 * points[4] + t ** 3 * points[6]
    const y = u ** 3 * points[1] + 3 * u ** 2 * t * points[3] + 3 * u * t ** 2 * points[5] + t ** 3 * points[7]
    const dx = 3 * u ** 2 * (points[2] - points[0]) + 6 * u * t * (points[4] - points[2]) + 3 * t ** 2 * (points[6] - points[4])
    const dy = 3 * u ** 2 * (points[3] - points[1]) + 6 * u * t * (points[5] - points[3]) + 3 * t ** 2 * (points[7] - points[5])
    const length = Math.hypot(dx, dy) || 1
    // The wisps taper into exactly the same title anchors as the main branch.
    const offset = Math.sin(t * Math.PI) * (strand * 1.55 + Math.sin(t * 42 + strand) * .65) / zoom
    return `${index ? 'L' : 'M'} ${(x - dy / length * offset).toFixed(2)} ${(y + dx / length * offset).toFixed(2)}`
  }).join(' ')
}

export const EnergyBranch = memo(function EnergyBranch({ id, from, to, d, start, end, sourceColor, targetColor, highlighted, zoom }: EnergyBranchProps) {
  const scale = Math.max(.08, zoom)
  const key = svgId(id)
  const filaments = useMemo(() => [-1, 1].map((strand) => branchFilament(d, strand, scale)), [d, scale])
  return (
    <g className={`energy-branch plasma-branch ${highlighted ? 'highlighted' : 'context'}`} data-from={from} data-to={to}>
      <defs>
        <linearGradient id={`${key}-plasma-color`} gradientUnits="userSpaceOnUse" x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
          <stop stopColor={sourceColor} /><stop offset=".5" stopColor="#e1e6ff" /><stop offset="1" stopColor={targetColor} />
        </linearGradient>
      </defs>
      <path className="plasma-branch-envelope" d={d} stroke={`url(#${key}-plasma-color)`} strokeWidth={9 / scale} />
      <path className="plasma-branch-sheath" d={d} stroke={`url(#${key}-plasma-color)`} strokeWidth={4 / scale} />
      {filaments.map((filament, index) => <path key={index} className="plasma-branch-wisp" d={filament} stroke={`url(#${key}-plasma-color)`} strokeWidth={.5 / scale} />)}
      <path className="plasma-branch-core" d={d} stroke={`url(#${key}-plasma-color)`} strokeWidth={1.15 / scale} />
      <path className="plasma-branch-heart" d={d} stroke="#fff" strokeWidth={.38 / scale} />
    </g>
  )
}, (previous, next) => previous.id === next.id && previous.from === next.from && previous.to === next.to && previous.d === next.d && previous.start.x === next.start.x && previous.start.y === next.start.y && previous.end.x === next.end.x && previous.end.y === next.end.y && previous.sourceColor === next.sourceColor && previous.targetColor === next.targetColor && previous.highlighted === next.highlighted && previous.zoom === next.zoom)
