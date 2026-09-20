<p align="center">
  <img src="public/image.png" alt="Marvel Multiverse Archive logo" width="704" />
</p>

# Marvel Multiverse Archive

An interactive archive of **234 Marvel movies and series** across **10 universes** — every title placed on a visual timeline, with explained connections between worlds.

Live: [marvel-multiverse-map.vercel.app](https://marvel-multiverse-map.vercel.app)

## What's inside

**Three views of the same archive:**

- **Multiverse Map** — 10 universe lanes on one canvas. Every title is a logo node on its universe's timeline; glowing branches show verified cross-universe connections (e.g. Tobey Maguire and Andrew Garfield entering the MCU in *No Way Home*). Zoom from full-map overview down to readable artwork, tap any branch for its explanation.
- **By Release Order** — every title grouped by era and phase within its universe (MCU Phases 1–6, Fox sagas, Raimi trilogy, Venom series, and more), sorted by premiere date.
- **By Chronological Order** — the same titles re-sorted by **in-universe story year**, researched against official timelines. Fox's timeline accounts for the *Days of Future Past* 1973 reset (1962 → 1973 → 1983 → 1992 → 2029); Sony's puts the *Madame Web* 2003 prequel first. Uncertain placements are badged, never silently treated as canon.

**Road to Doomsday** — a curated 70-title watchlist mode on the map: everything worth watching before *Avengers: Doomsday*, drawn from official cast announcements, post-credit teases, and consensus watch guides. Toggle it in the map toolbar.

**Title inspector** — click any title for its universe, Earth designation, continuity status, release/chronology placement, a plot synopsis (232 titles), and every explained link in and out.

## The universes

MCU / Earth-616, Fox X-Men (Earth-10005), Raimi Spider-Man, Amazing Spider-Man, Sony / Venom, Legacy Marvel, Marvel Television, Defenders Saga, Marvel Animation, and Alternate Realities — kept distinct, with 50 explained connections between them.

## Notes on this project

- Title logos are local prototype assets for a personal archive; source pages are tracked in `public/assets/posters/SOURCES.md`.
- Synopses ship from TMDB overviews via `node scripts/fetch-synopses.mjs` (needs a free `TMDB_API_KEY`).
- Mobile gets the same archive with touch gestures: swipe between views, drag the sidebar drawer, collapse panels for more map space.

## Local development

```bash
npm install
npm run dev     # local server
npm run build   # typecheck + production build
node --test tests/mapGeometry.test.mjs
```
