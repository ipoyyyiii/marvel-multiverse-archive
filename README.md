<p align="center">
  <img src="public/image.png" alt="Marvel Multiverse Archive logo" width="240" />
</p>

# Marvel Multiverse Archive

Marvel Multiverse Archive is a personal, high-fidelity React archive for exploring Marvel screen continuities. It presents every cataloged title as a visual title-logo node across three synchronized views:

- **Multiverse Map** — universe lanes, continuous plasma-like spines, and explained cross-universe branches.
- **By Release Order** — universe-specific phases/tracks arranged by release sequence.
- **By Chronological Order** — story placement with date labels, status markers, and continuity notes.

The archive keeps MCU/Earth-616, Fox X-Men, Raimi Spider-Man, Amazing Spider-Man, Sony/Venom, Legacy Marvel, Marvel Television, Defenders, Animation, Spider-Verse, and alternate realities distinct. Uncertain placements are labeled rather than silently treated as canon.

## Live demo

Open the deployed archive at [marvel-multiverse-archive.vercel.app](https://marvel-multiverse-archive.vercel.app).

## Local development

```bash
npm install
npm run dev
```

Create a production build and preview it locally:

```bash
npm run build
npm run preview
```

## Verification

The geometry suite runs directly with Node:

```bash
node --test tests/mapGeometry.test.mjs
```

It covers continuous universe spines, title placement, zoom legibility, crossover endpoints, filters, and the “Show All Titles” state.

## Project structure

- `src/App.tsx` — application shell, navigation, filters, inspector, and view switching.
- `src/MultiverseMap.tsx` — interactive map and connection rendering.
- `src/ReleaseOrder.tsx` — release-order universe/phase view.
- `src/ChronologicalOrder.tsx` — chronological timeline view.
- `src/data/catalog.ts` — catalog records, universes, and explained connections.
- `src/data/logoManifest.ts` — title-to-logo routing table.
- `src/TimelineEnergy.tsx`, `src/plasma.css` — lightweight plasma-flow visuals.
- `public/assets/logos/` — source title logos.
- `public/assets/logos/release/` — 640px derivatives for card galleries.

## Logo assets

Add or replace a logo in `public/assets/logos/`, then update `src/data/logoManifest.ts`. Regenerate gallery derivatives with:

```bash
node scripts/prepare-release-logo-assets.mjs
```

Use transparent PNG or SVG title artwork where possible. Keep filenames lowercase, kebab-case, and scoped by universe (for example, `fox-x-men-first-class.png`).

## Deployment

The project is a static Vite build and is ready for Vercel, Cloudflare Pages, or another static host.

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm ci`

No backend or environment variables are required for the current archive.

## Catalog policy

The catalog includes released screen projects plus clearly marked announced/future nodes for orientation. Continuity categories are organizational views; a shared studio or actor does not imply a shared universe. Legacy titles remain separated when their continuity is unclear.
