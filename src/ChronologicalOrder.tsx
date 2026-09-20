import { CalendarDays, CircleAlert, Film, Tv2 } from 'lucide-react'
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  catalog,
  universes,
  type MarvelTitle,
  type Universe,
  type UniverseId,
} from './data/catalog'
import { releaseLogoPath } from './data/logoAssets'
import { EnergySpine, TimelineFlowPulse, streamColor, useReducedMotion, type FlowSpine } from './TimelineEnergy'

/** A chronology record can carry a more precise placement than the catalog's
 * release year without changing the source catalog itself. */
export interface ChronologicalEntry {
  title: MarvelTitle
  dateLabel?: string
  sortYear?: number
  status?: ChronologyStatus
  note?: string
  side?: 'left' | 'right'
}

export type ChronologyStatus = 'confirmed' | 'approximate' | 'disputed' | 'alternate' | 'mcu-adjacent'

export interface ChronologicalGroup {
  id: string
  label?: string
  subtitle?: string
  entries: ChronologicalEntry[]
}

export interface ChronologicalOrderProps {
  /** The single universe shown by this chronology viewport. */
  universeId?: UniverseId
  /** Optional catalog override; titles are converted to chronology entries. */
  titles?: MarvelTitle[]
  /** Optional pre-built eras. Supplying groups preserves custom chronology. */
  groups?: ChronologicalGroup[]
  /** Optional flat entry override when a parent owns chronology mapping. */
  entries?: ChronologicalEntry[]
  /** Universe records rendered as the page-level tab selector. */
  universeOptions?: Universe[]
  universeIndex?: number
  onUniverseChange?: (universeId: UniverseId) => void
  onPreviousUniverse?: () => void
  onNextUniverse?: () => void
  selectedId?: string
  /** When false, selection chrome hides even though a last title is remembered. */
  selectionActive?: boolean
  onSelectTitle?: (titleId: string) => void
  renderTitleLogo?: (title: MarvelTitle) => ReactNode
  className?: string
}

const STATUS_LABELS: Record<ChronologyStatus, string> = {
  confirmed: 'CONFIRMED',
  approximate: 'PLACEMENT APPROX.',
  disputed: 'CHRONOLOGY DISPUTED',
  alternate: 'ALTERNATE REALITY',
  'mcu-adjacent': 'MCU-ADJACENT',
}

/* These are intentionally conservative display labels. The catalog's
 * chronologyYear remains the source of truth; ranges are only used where the
 * story is explicitly presented as a period rather than a single year. */
const CHRONOLOGY_LABELS: Record<string, string> = {
  'Captain America: The First Avenger': '1942–1945',
  'Agent Carter': '1946–1947',
  'Captain Marvel': '1995',
  'Iron Man': '2010',
  'Iron Man 2': '2011',
  'Thor': '2011',
  'The Avengers': '2012',
  'Iron Man 3': 'Late 2012',
  'Avengers: Endgame': '2018 → 2023',
  'Loki': 'Outside linear time',
}

const decadeFor = (year: number) => {
  if (year < 1940) return { id: 'era-1930s', label: '1930s', subtitle: 'Origins and first appearances' }
  if (year < 1950) return { id: 'era-1940s', label: '1940s', subtitle: 'Origins and first appearances' }
  if (year < 2000) return { id: 'era-20th-century', label: '20TH CENTURY', subtitle: 'Legacy continuities and early worlds' }
  if (year < 2010) return { id: 'era-2000s', label: '2000s', subtitle: 'Separate cinematic continuities' }
  if (year < 2020) return { id: 'era-2010s', label: '2010s', subtitle: 'The connected era expands' }
  return { id: 'era-2020s', label: '2020s', subtitle: 'New sagas and branching realities' }
}

const getUniverse = (id: UniverseId) => universes.find((universe) => universe.id === id) || universes[0]

const belongsToUniverse = (title: MarvelTitle, universeId: UniverseId) => (
  title.universeId === universeId || Boolean(title.viewUniverseIds?.includes(universeId))
)

const titleStatus = (title: MarvelTitle): ChronologyStatus => {
  if (title.continuityStatus === 'alternate') return 'alternate'
  if (title.continuityStatus === 'mcu-adjacent') return 'mcu-adjacent'
  if (title.continuityStatus === 'disputed') return 'disputed'
  // chronologyYear is explicit in the curated catalog. Missing placement is
  // shown as approximate rather than presenting the release year as canon.
  return title.chronologyYear ? 'confirmed' : 'approximate'
}

const chronologySortYear = (title: MarvelTitle) => title.chronologyYear ?? title.year

const chronologyDateLabel = (title: MarvelTitle, override?: string) => (
  override || CHRONOLOGY_LABELS[title.title] || (title.chronologyYear ? String(title.chronologyYear) : `c. ${title.year}`)
)

const makeEntry = (title: MarvelTitle): ChronologicalEntry => ({
  title,
  dateLabel: chronologyDateLabel(title),
  sortYear: chronologySortYear(title),
  status: titleStatus(title),
})

const formatEntryMeta = (title: MarvelTitle) => {
  const icon = title.format === 'Film' ? <Film size={11} aria-hidden="true" /> : <Tv2 size={11} aria-hidden="true" />
  return (
    <span className="chronological-entry-meta">
      <span className="chronological-format">{icon}{title.format}</span>
      {title.seasons ? <span className="chronological-season">{title.seasons === 1 ? '1 SEASON' : `${title.seasons} SEASONS`}</span> : null}
      {title.released
        ? <span className="chronological-release">RELEASED {title.year}</span>
        : <span className="chronological-coming-soon">COMING SOON · {title.year}</span>}
    </span>
  )
}

function ChronologicalLogo({
  title,
  selected,
  renderTitleLogo,
}: {
  title: MarvelTitle
  selected: boolean
  renderTitleLogo?: (title: MarvelTitle) => ReactNode
}) {
  if (renderTitleLogo) return <span className="chronological-logo-custom">{renderTitleLogo(title)}</span>
  if (title.logo) return <img className="chronological-logo-image" src={releaseLogoPath(title.logo)} alt={`${title.title} title logo`} loading="lazy" decoding="async" />

  return (
    <span className={`chronological-logo-fallback ${selected ? 'chronological-logo-fallback-selected' : ''}`} aria-hidden="true">
      {title.title}
    </span>
  )
}

function ChronologicalTitleNode({
  entry,
  side,
  accent,
  selected,
  onSelectTitle,
  renderTitleLogo,
}: {
  entry: ChronologicalEntry
  side: 'left' | 'right'
  accent: string
  selected: boolean
  onSelectTitle?: (titleId: string) => void
  renderTitleLogo?: (title: MarvelTitle) => ReactNode
}) {
  const { title } = entry
  const status = entry.status || titleStatus(title)
  const dateLabel = chronologyDateLabel(title, entry.dateLabel)

  return (
    <div
      className={`chronological-entry chronological-entry-${side}`}
      data-status={status}
      data-format={title.format.toLowerCase()}
    >
      <button
        type="button"
        className={`chronological-card ${selected ? 'chronological-card-selected' : ''}`}
        style={{ '--chronological-accent': accent } as CSSProperties}
        onClick={() => onSelectTitle?.(title.id)}
        aria-label={`Open ${title.title}, chronology ${dateLabel}`}
        aria-pressed={selected}
      >
        <span className="chronological-logo-stage">
          <ChronologicalLogo title={title} selected={selected} renderTitleLogo={renderTitleLogo} />
        </span>
        <span className="chronological-card-content">
          <span className="chronological-card-topline">
            <span className="chronological-date"><CalendarDays size={11} aria-hidden="true" />{dateLabel}</span>
            {status !== 'confirmed' ? <span className={`chronological-status chronological-status-${status}`}><CircleAlert size={10} aria-hidden="true" />{STATUS_LABELS[status]}</span> : null}
          </span>
          <span className="chronological-card-title">{title.title}</span>
          {formatEntryMeta(title)}
          {entry.note ? <span className="chronological-entry-note">{entry.note}</span> : null}
        </span>
      </button>
      <span className="chronological-node" aria-hidden="true"><i /></span>
    </div>
  )
}

const timelineSeed = (universeId: UniverseId) => [...universeId].reduce((value, character) => value + character.charCodeAt(0), 0)

const CHRONOLOGICAL_STYLES = `
.chronological-order {
  --chronological-accent: #f0253e;
  grid-column: 2;
  grid-row: 1 / 3;
  position: relative;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: auto;
  color: #f2f4f8;
  background:
    radial-gradient(circle at 50% -8%, color-mix(in srgb, var(--chronological-accent) 18%, transparent), transparent 36%),
    linear-gradient(180deg, rgba(3, 6, 11, .42), rgba(2, 4, 8, .97)),
    url('/assets/cosmic-archive-bg.png') center / cover fixed;
  scrollbar-color: #3b4556 #080b10;
}
.chronological-order::before {
  content: '';
  position: absolute;
  z-index: 0;
  top: 0;
  left: 5%;
  right: 5%;
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--chronological-accent) 64%, #fff 15%), transparent);
  box-shadow: 0 0 18px color-mix(in srgb, var(--chronological-accent) 34%, transparent);
}
.chronological-order > * { position: relative; z-index: 1; }
.chronological-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: clamp(24px, 3vw, 42px) clamp(20px, 4vw, 64px) 0;
  max-width: 1440px;
  margin: 0 auto;
}
.chronological-universe-control {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: #c4ccda;
  border: 1px solid #3a4658;
  border-radius: 50%;
  background: rgba(8, 12, 19, .78);
  transition: color .18s, border-color .18s, background .18s, transform .18s;
}
.chronological-universe-control:hover:not(:disabled) {
  color: #fff;
  border-color: color-mix(in srgb, var(--chronological-accent) 72%, #fff 18%);
  background: color-mix(in srgb, var(--chronological-accent) 14%, #080c13);
  transform: scale(1.04);
}
.chronological-universe-control:disabled { opacity: .28; cursor: default; }
.chronological-heading { min-width: 0; }
.chronological-kicker {
  display: block;
  margin-bottom: 7px;
  color: color-mix(in srgb, var(--chronological-accent) 78%, #fff 18%);
  font: 700 9px/1 "Barlow Condensed", sans-serif;
  letter-spacing: 2px;
}
.chronological-heading h1 {
  margin: 0;
  color: #f8faff;
  font: 800 clamp(26px, 3vw, 44px)/.94 "Barlow Condensed", Impact, sans-serif;
  letter-spacing: 1.2px;
}
.chronological-heading p { max-width: 660px; margin: 9px 0 0; color: #8d98aa; font-size: 11px; line-height: 1.45; }
.chronological-header-index { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; color: #697489; font: 700 8px/1 "Barlow Condensed", sans-serif; letter-spacing: 1.7px; }
.chronological-header-index b { color: #e6ebf4; font-size: 17px; letter-spacing: 1px; }
.chronological-header-index i { color: #596475; font-style: normal; }
.chronological-header-index small { color: #758196; font-size: 7px; letter-spacing: 1px; }
.chronological-universe-tabs {
  display: flex;
  align-items: stretch;
  gap: 2px;
  max-width: 1440px;
  margin: 22px auto 0;
  padding-inline: clamp(20px, 4vw, 64px);
  border-bottom: 1px solid rgba(142, 158, 181, .2);
  overflow-x: auto;
  scrollbar-width: none;
}
.chronological-universe-tabs::-webkit-scrollbar { display: none; }
.chronological-universe-tab {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 11px;
  color: #747f91;
  border: 0;
  background: transparent;
  font: 700 9px/1 "Barlow Condensed", sans-serif;
  letter-spacing: .65px;
  white-space: nowrap;
  transition: color .18s, background .18s;
}
.chronological-universe-tab:hover { color: color-mix(in srgb, var(--universe-tab-accent) 74%, #fff 18%); background: rgba(255, 255, 255, .035); }
.chronological-universe-tab.active { color: var(--universe-tab-accent); background: color-mix(in srgb, var(--universe-tab-accent) 8%, transparent); }
.chronological-universe-tab.active::after { content: ''; position: absolute; right: 8px; bottom: -1px; left: 8px; height: 2px; border-radius: 2px 2px 0 0; background: var(--universe-tab-accent); box-shadow: 0 0 10px color-mix(in srgb, var(--universe-tab-accent) 68%, transparent); }
.chronological-rule { display: flex; align-items: center; gap: 9px; max-width: 1440px; margin: 27px auto 5px; padding: 0 clamp(20px, 4vw, 64px); }
.chronological-rule span { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(194, 210, 232, .24)); }
.chronological-rule span:last-child { background: linear-gradient(90deg, rgba(194, 210, 232, .24), transparent); }
.chronological-rule i { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; background: var(--chronological-accent); box-shadow: 0 0 15px color-mix(in srgb, var(--chronological-accent) 72%, transparent); }
.chronological-legend { display: flex; justify-content: flex-end; gap: 9px; padding: 0 clamp(20px, 4vw, 64px); color: #778398; font: 700 8px/1 "Barlow Condensed", sans-serif; letter-spacing: .8px; }
.chronological-legend b { color: #cfd7e4; font-weight: 700; }
.chronological-timeline { position: relative; max-width: 1240px; margin: 18px auto 0; padding: 0 clamp(20px, 4vw, 64px) 70px; will-change: transform, opacity; }
.chronological-spine-energy {
  position: absolute;
  z-index: 0;
  top: 0;
  width: 80px;
  height: var(--chronological-spine-length, 0px);
  left: 50%;
  transform: translateX(-50%);
  overflow: visible;
  pointer-events: none;
}
.chronological-spine-flow {
  position: absolute;
  z-index: 0;
  top: 0;
  left: 50%;
  width: 80px;
  height: var(--chronological-spine-length, 0px);
  transform: translateX(-50%);
  overflow: visible;
  pointer-events: none;
}
.chronological-era { position: relative; z-index: 1; margin: 0; }
.chronological-era-header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 15px; min-height: 56px; }
.chronological-era-header::before, .chronological-era-header::after { content: ''; height: 1px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--chronological-accent) 56%, transparent)); }
.chronological-era-header::after { background: linear-gradient(90deg, color-mix(in srgb, var(--chronological-accent) 56%, transparent), transparent); }
.chronological-era-header > div { min-width: 130px; padding: 6px 16px; border: 1px solid color-mix(in srgb, var(--chronological-accent) 46%, transparent); border-radius: 5px; background: rgba(6, 9, 15, .88); box-shadow: 0 0 20px color-mix(in srgb, var(--chronological-accent) 12%, transparent); text-align: center; }
.chronological-era-label { display: block; color: #f1f4fa; font: 800 14px/1 "Barlow Condensed", sans-serif; letter-spacing: 1.8px; }
.chronological-era-subtitle { display: block; margin-top: 5px; color: #79869a; font: 600 8px/1 "Barlow Condensed", sans-serif; letter-spacing: .7px; }
.chronological-entry { display: grid; grid-template-columns: minmax(0, 1fr) 42px minmax(0, 1fr); align-items: center; min-height: 148px; }
.chronological-entry-left .chronological-card { grid-column: 1; grid-row: 1; }
.chronological-entry-right .chronological-card { grid-column: 3; grid-row: 1; }
.chronological-node { grid-column: 2; grid-row: 1; justify-self: center; width: 19px; height: 19px; display: grid; place-items: center; border: 2px solid #f7f9fd; border-radius: 50%; background: #0b1018; box-shadow: 0 0 0 4px rgba(8, 12, 18, .76), 0 0 16px color-mix(in srgb, var(--chronological-accent) 76%, transparent); }
.chronological-node i { width: 6px; height: 6px; border-radius: 50%; background: var(--chronological-accent); box-shadow: 0 0 10px color-mix(in srgb, var(--chronological-accent) 90%, transparent); }
.chronological-card { position: relative; min-width: 0; min-height: 118px; display: flex; align-items: center; justify-content: flex-end; gap: 13px; padding: 0; color: #ecf0f7; border: 0; border-radius: 0; background: transparent; box-shadow: none; text-align: initial; transition: transform .18s, filter .18s; }
.chronological-entry-left .chronological-card { margin-right: 23px; align-items: center; text-align: right; }
.chronological-entry-right .chronological-card { margin-left: 23px; align-items: center; justify-content: flex-start; text-align: left; }
.chronological-card-content { min-width: 0; flex: 0 1 280px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
.chronological-entry-left .chronological-card-content { order: 1; align-items: flex-end; }
.chronological-entry-right .chronological-card-content { order: 2; align-items: flex-start; }
.chronological-logo-stage { position: relative; z-index: 1; flex: 0 0 150px; width: 150px; height: 76px; display: grid; place-items: center; overflow: visible; background: radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--chronological-accent) 12%, transparent), transparent 72%); }
.chronological-entry-left .chronological-logo-stage { order: 2; }
.chronological-entry-right .chronological-logo-stage { order: 1; }
.chronological-card::after { content: ''; position: absolute; top: 50%; width: 23px; height: 1px; background: linear-gradient(90deg, color-mix(in srgb, var(--chronological-accent) 70%, transparent), rgba(228,239,255,.7)); box-shadow: 0 0 10px color-mix(in srgb, var(--chronological-accent) 55%, transparent); }
.chronological-entry-left .chronological-card::after { right: -24px; }
.chronological-entry-right .chronological-card::after { left: -24px; transform: rotate(180deg); }
.chronological-card:hover { filter: brightness(1.12); transform: translateY(-3px); }
.chronological-card:focus-visible { outline: 1px solid color-mix(in srgb, var(--chronological-accent) 80%, #fff 20%); outline-offset: 4px; }
.chronological-card-selected .chronological-logo-stage { filter: brightness(1.12) drop-shadow(0 0 12px color-mix(in srgb, var(--chronological-accent) 42%, transparent)); }
.chronological-card-selected .chronological-card-title { color: color-mix(in srgb, var(--chronological-accent) 62%, #fff 30%); }
.chronological-card-topline { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 7px; color: #b9c4d4; }
.chronological-date { display: inline-flex; align-items: center; gap: 5px; color: color-mix(in srgb, var(--chronological-accent) 75%, #fff 22%); font: 800 12px/1 "Barlow Condensed", sans-serif; letter-spacing: .6px; white-space: nowrap; }
.chronological-status { display: inline-flex; align-items: center; gap: 3px; color: #9ba7ba; font: 700 7px/1 "Barlow Condensed", sans-serif; letter-spacing: .7px; white-space: nowrap; }
.chronological-status-disputed { color: #ffb4bd; }
.chronological-status-alternate { color: #c6b5ff; }
.chronological-status-mcu-adjacent { color: #ffcf91; }
.chronological-logo-image { display: block; width: 100%; max-width: 150px; max-height: 70px; object-fit: contain; filter: drop-shadow(0 2px 5px rgba(0,0,0,.82)); }
.chronological-logo-custom { display: contents; }
.chronological-logo-custom > * { max-width: 150px; max-height: 70px; object-fit: contain; }
.chronological-logo-fallback { max-width: 150px; color: #f1f4fa; text-shadow: 0 2px 5px #000; font: italic 800 17px/.88 "Barlow Condensed", sans-serif; letter-spacing: .3px; text-align: center; text-transform: uppercase; }
.chronological-logo-fallback-selected { color: #fff; text-shadow: 0 0 15px color-mix(in srgb, var(--chronological-accent) 86%, transparent), 0 2px 5px #000; }
.chronological-card-title { max-width: 100%; overflow: hidden; color: #c2ccda; font-size: 10px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
.chronological-entry-meta { display: inline-flex; align-items: center; flex-wrap: wrap; justify-content: inherit; gap: 6px; color: #748095; font: 700 8px/1 "Barlow Condensed", sans-serif; letter-spacing: .55px; }
.chronological-format { display: inline-flex; align-items: center; gap: 3px; }
.chronological-season { padding: 3px 5px 2px; color: color-mix(in srgb, var(--chronological-accent) 65%, #fff 24%); border: 1px solid color-mix(in srgb, var(--chronological-accent) 38%, transparent); border-radius: 3px; font-size: 7px; }
.chronological-release { color: #5d6a7d; }
.chronological-coming-soon { color: #d8cdff; }
.chronological-entry-note { max-width: 94%; overflow: hidden; color: #8591a4; font-size: 8px; line-height: 1.3; text-overflow: ellipsis; white-space: nowrap; }
.chronological-empty { margin: 80px auto; color: #8995a8; text-align: center; }
@media (max-width: 820px) {
  .chronological-order { grid-column: 1; grid-row: 1 / 3; width: 100%; max-width: 100%; }
  .chronological-header { grid-template-columns: minmax(0,1fr); gap: 8px; padding-inline: 16px; }
  .chronological-header-index { display: none; }
  .chronological-universe-control { width: 32px; height: 32px; }
  .chronological-universe-tabs { margin-top: 18px; padding-inline: 16px; }
  .chronological-universe-tab { min-height: 44px; padding-inline: 11px; font-size: 8px; scroll-snap-align: start; }
  .chronological-rule { padding-inline: 16px; }
  .chronological-legend { justify-content: center; padding-inline: 16px; }
  .chronological-timeline { padding-inline: 16px; }
  /* Mobile keeps the desktop zigzag: center spine, cards alternate
   *  left/right. Cards compress to the narrow columns (logo above text)
   *  instead of the desktop side-by-side lockup. */
  .chronological-entry { grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr); min-height: 0; column-gap: 0; }
  .chronological-entry-left .chronological-card { grid-column: 1; grid-row: 1; min-width: 0; max-width: 100%; margin: 0 4px 0 0; padding: 0; flex-direction: column; align-items: flex-end; gap: 4px; text-align: right; }
  .chronological-entry-right .chronological-card { grid-column: 3; grid-row: 1; min-width: 0; max-width: 100%; margin: 0 0 0 4px; padding: 0; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; }
  .chronological-spine-energy, .chronological-spine-flow { left: 50%; transform: translateX(-50%); }
  .chronological-entry .chronological-node { grid-column: 2; grid-row: 1; justify-self: center; width: 13px; height: 13px; }
  .chronological-entry-left .chronological-card-content, .chronological-entry-right .chronological-card-content { order: 2; align-items: inherit; flex: 1 1 auto; flex-basis: auto; width: 100%; min-width: 0; max-width: 100%; }
  .chronological-entry-left .chronological-logo-stage, .chronological-entry-right .chronological-logo-stage { order: 1; }
  .chronological-entry-left .chronological-card::after { left: auto; right: -5px; transform: none; }
  .chronological-entry-right .chronological-card::after { left: -5px; right: auto; transform: rotate(180deg); }
  .chronological-logo-stage { flex: 0 0 auto; width: 100%; min-width: 0; max-width: 100%; height: 44px; }
  .chronological-logo-image, .chronological-logo-custom > * { width: 100%; max-width: 100%; max-height: 40px; }
  .chronological-card-topline { max-width: 100%; }
  .chronological-card-title { max-width: 100%; overflow-wrap: anywhere; }
  .chronological-era-header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; min-height: 56px; margin: 14px 0; }
  .chronological-era-header::before, .chronological-era-header::after { display: block; content: ''; height: 1px; }
  .chronological-era-header > div { justify-self: center; margin-left: 0; min-width: 0; padding: 6px 12px; }
  .chronological-card-topline { flex-wrap: wrap; }
  .chronological-card-title { font-size: 11px; line-height: 1.25; white-space: normal; }
  .chronological-entry-meta { font-size: 9px; line-height: 1.25; }
  .chronological-entry-note { max-width: 100%; overflow: visible; font-size: 9px; line-height: 1.35; text-overflow: clip; white-space: normal; }
}
@media (prefers-reduced-motion: reduce) { .chronological-universe-control, .chronological-card { transition: none; } }
`

const buildGroups = (source: ChronologicalEntry[]) => {
  const sorted = [...source].sort((a, b) => (a.sortYear ?? chronologySortYear(a.title)) - (b.sortYear ?? chronologySortYear(b.title)) || a.title.releaseDate.localeCompare(b.title.releaseDate) || a.title.title.localeCompare(b.title.title))
  const groups = new Map<string, ChronologicalGroup>()

  sorted.forEach((entry, index) => {
    const year = entry.sortYear ?? chronologySortYear(entry.title)
    const era = decadeFor(year)
    const current = groups.get(era.id)
    const side = entry.side || (index % 2 === 0 ? 'left' : 'right')
    const nextEntry = { ...entry, side }
    if (current) current.entries.push(nextEntry)
    else groups.set(era.id, { ...era, entries: [nextEntry] })
  })

  return [...groups.values()]
}

export default function ChronologicalOrder({
  universeId = 'mcu',
  titles = catalog,
  groups,
  entries,
  universeOptions = universes,
  universeIndex,
  onUniverseChange,
  onPreviousUniverse,
  onNextUniverse,
  selectedId,
  selectionActive = true,
  onSelectTitle,
  renderTitleLogo,
  className = '',
}: ChronologicalOrderProps) {
  const activeSelectedId = selectionActive ? selectedId : ''
  const universe = getUniverse(universeId)
  const universeList = universeOptions.length ? universeOptions : universes
  const currentIndex = universeIndex ?? Math.max(0, universeList.findIndex((item) => item.id === universeId))

  const universeEntries = useMemo(() => {
    if (entries) return entries
    return titles.filter((title) => belongsToUniverse(title, universeId)).map(makeEntry)
  }, [entries, titles, universeId])

  const chronologicalGroups = useMemo(() => groups || buildGroups(universeEntries), [groups, universeEntries])
  const totalEntries = chronologicalGroups.reduce((total, group) => total + group.entries.length, 0)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [spineLength, setSpineLength] = useState(0)
  const reducedMotion = useReducedMotion()
  useLayoutEffect(() => {
    const element = timelineRef.current
    if (!element) return
    const measure = () => {
      const nextLength = Math.max(0, element.clientHeight - 50)
      setSpineLength((current) => current === nextLength ? current : nextLength)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [chronologicalGroups.length])
  const chronologicalSpine = useMemo<FlowSpine>(() => ({
    id: `chronological-flow-${universe.id}`,
    universeId: universe.id,
    start: 0,
    end: spineLength,
    y: 40,
    streamColor: streamColor(universe.id),
    seed: timelineSeed(universe.id),
  }), [spineLength, universe.id])

  return (
    <section
      className={`chronological-order ${className}`.trim()}
      style={{ '--chronological-accent': universe.color } as CSSProperties}
      data-universe={universe.id}
      aria-label={`${universe.name} chronological order`}
    >
      <style>{CHRONOLOGICAL_STYLES}</style>
      <header className="chronological-header">
        <div className="chronological-heading">
          <span className="chronological-kicker">CHRONOLOGICAL ORDER · ONE UNIVERSE VIEW</span>
          <h1>{universe.shortName}</h1>
          <p>Follow each story by when it happens, not when it premiered. Uncertain placements stay clearly marked.</p>
        </div>
        <div className="chronological-header-index">
          <span>UNIVERSE</span>
          <b>{String(currentIndex + 1).padStart(2, '0')} <i>/</i> {String(universeList.length).padStart(2, '0')}</b>
          <small>{totalEntries} CHRONOLOGICAL TITLES</small>
        </div>
      </header>

      <nav className="chronological-universe-tabs" aria-label="Select universe">
        {universeList.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`chronological-universe-tab ${option.id === universe.id ? 'active' : ''}`}
            style={{ '--universe-tab-accent': option.color } as CSSProperties}
            onClick={() => onUniverseChange?.(option.id)}
            aria-current={option.id === universe.id ? 'page' : undefined}
          >
            {option.shortName}
          </button>
        ))}
      </nav>

      <div className="chronological-rule" aria-hidden="true"><span /><i /><span /></div>
      <div className="chronological-legend"><span><b>SPINE</b> · STORY TIME</span><span><b>BADGES</b> · PLACEMENT NOTES</span></div>

      <div ref={timelineRef} className="chronological-timeline">
        {spineLength > 0 && (
          <>
            <svg
              className="chronological-spine-energy"
              width="80"
              height={spineLength}
              viewBox={`0 0 80 ${spineLength}`}
              style={{ '--chronological-spine-length': `${spineLength}px` } as CSSProperties}
              aria-hidden="true"
            >
              <EnergySpine
                id={chronologicalSpine.id}
                universeId={chronologicalSpine.universeId}
                color={universe.color}
                start={chronologicalSpine.start}
                end={chronologicalSpine.end}
                y={chronologicalSpine.y}
                zoom={1}
                flowing={!reducedMotion}
                orientation="vertical"
              />
            </svg>
            <div
              className="chronological-spine-flow"
              style={{ '--chronological-spine-length': `${spineLength}px` } as CSSProperties}
              aria-hidden="true"
            >
              <TimelineFlowPulse spine={chronologicalSpine} zoom={1} flowing={!reducedMotion} orientation="vertical" />
            </div>
          </>
        )}
        {chronologicalGroups.length ? chronologicalGroups.map((group) => (
          <section className="chronological-era" key={group.id}>
            <header className="chronological-era-header">
              <div>
                <span className="chronological-era-label">{group.label || group.id.replaceAll('-', ' ').toUpperCase()}</span>
                {group.subtitle ? <small className="chronological-era-subtitle">{group.subtitle}</small> : null}
              </div>
            </header>
            {group.entries.map((entry, index) => (
              <ChronologicalTitleNode
                key={`${group.id}-${entry.title.id}-${index}`}
                entry={entry}
                side={entry.side || (index % 2 === 0 ? 'left' : 'right')}
                accent={universe.color}
                selected={entry.title.id === activeSelectedId}
                onSelectTitle={onSelectTitle}
                renderTitleLogo={renderTitleLogo}
              />
            ))}
          </section>
        )) : <p className="chronological-empty">No released titles are mapped for this universe yet.</p>}
      </div>
    </section>
  )
}

export { ChronologicalTitleNode, chronologyDateLabel, makeEntry }
