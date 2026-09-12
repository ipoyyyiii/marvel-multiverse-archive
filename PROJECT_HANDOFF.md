# Marvel Multiverse Archive — Project Handoff

Read this file before changing the app. It is the product and engineering context for future code agents.

## Product intent

This is a personal Marvel screen-archive, not a generic dashboard or streaming catalog. The app has three views in the header: **Multiverse Map**, **By Release Order**, and **By Chronological Order**. The complete catalog remains accessible through universe tabs, filters, search, scrolling, zooming, and focused views.

The map is a relationship diagram, not a date axis. Every universe owns one continuous timeline spine. MCU is centered. Same-universe continuity uses one thick straight plasma beam; cross-universe relationships use thinner curved plasma branches between exact title anchors. Do not add a “Multiverse Branches” universe lane. Loki/TVA is a hub node. Every important branch needs a specific source title, target title, relationship type, and explanation.

## Current universe taxonomy

`mcu`, `fox`, `raimi`, `amazing`, `sony`, `legacy`, `marvel-tv`, `defenders`, `animation`, and `alternate` are defined in `src/data/catalog.ts`. Defenders is grouped under Marvel Television/MCU-adjacent presentation and is distinct from the 2003 Daredevil film. Legacy is an organizational bucket; its films are not assumed to share one continuity. Disputed and alternate placements must stay visibly classified.

## Source of truth and data flow

- `src/data/catalog.ts` owns title records, universe metadata, release dates, formats, seasons, continuity labels, Earth designations, chronology years, events, and connection explanations.
- `src/data/logoManifest.ts` maps `${universeId}:${title}` to local transparent logo assets. Never infer a universe from an actor, studio, or distributor.
- `src/releaseGroups.ts` builds MCU phases 1–6 and non-MCU cycles/eras for release order.
- `src/chronologyData.ts` creates per-universe chronological entries. `c. YYYY` means approximate placement because the catalog only has a year, not an exact story date; never invent precision.
- `src/mapGeometry.ts` owns lane placement, semantic zoom, continuous spine extents, and cubic branch routing. Keep geometry deterministic.

## View-specific rules

- **Multiverse Map:** use `MultiverseMap.tsx`, `TimelineEnergy.tsx`, `MapMinimap.tsx`, and `mapSelection.ts`. The map keeps one spine per visible universe, places logos near the spine, and routes branches behind artwork. Clicking a branch opens its explanation; hover alone must not open a pop-up. Closing the inspector clears selection chrome and minimap selection.
- **By Release Order:** `ReleaseOrder.tsx` renders every released record as an individual logo node. MCU uses phase panels; other universes use continuity cycles/eras. Cards use 640px derivatives through `releaseLogoPath`.
- **By Chronological Order:** `ChronologicalOrder.tsx` renders each universe separately as a vertical timeline. It reuses the same beam language rotated vertically and uses logos, format/season metadata, and confirmed/approximate/disputed labels.

## Visual invariants

Use near-black cinematic surfaces, thin borders, restrained glow, and Marvel red for active controls. Main beams are white for MCU and universe-colored for other lanes; moving highlights remain white on every beam. Branches are thinner, dimmer, curved, and never decorative spaghetti. Preserve title-logo artwork as the primary node visual; fallback wordmarks are only for missing assets.

## Assets and performance

Source logos live in `public/assets/logos/`; release/chronology gallery derivatives live in `public/assets/logos/release/`. Run `node scripts/prepare-release-logo-assets.mjs` after adding or replacing logos. Keep filenames lowercase kebab-case and update the manifest. `public/image.png` is README branding only; it is not a movie asset or favicon.

The plasma effect is deliberately fixed-cost: static SVG envelopes/wisps plus small CSS transform/opacity pulses. Do not reintroduce `feTurbulence`, animated SVG attributes, per-frame React state, or viewport-dependent geometry. Keep artwork mounted while panning, pause flow when the document is hidden, and preserve memoization. Verify “Show All Titles”, one-universe mode, branch routing, zoom, minimap, and inspector close behavior after map changes.

## Development and handoff checklist

```bash
npm install
npm run dev
npm run build
node --test tests/mapGeometry.test.mjs
```

Before editing, inspect `git status`, preserve unrelated user changes, and update the smallest responsible module. After editing, run the build and geometry tests, then report whether browser/live verification was performed. The repository is `https://github.com/ipoyyyiii/marvel-multiverse-archive`; the current Vercel site is `https://marvel-multiverse-archive.vercel.app`. The Vercel project was deployed through the connected plugin, so Git pushes do not automatically redeploy it; verify deployment status before claiming a live update.
