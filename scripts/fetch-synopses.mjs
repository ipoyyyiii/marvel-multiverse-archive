/**
 * Fetches plot synopses (TMDB overviews) for every catalog title and writes
 * them to src/data/synopses.ts, keyed by catalog id.
 *
 * Usage:
 *   TMDB_API_KEY=xxxx node scripts/fetch-synopses.mjs
 *   TMDB_API_KEY=xxxx node scripts/fetch-synopses.mjs --limit 10   (smoke test)
 *
 * Matching is by catalog id first (exact TMDB id overrides in
 * TMDB_OVERRIDES), otherwise falls back to a TMDB search on
 * "<universe>:<title> <year>". Results are cached in
 * scripts/.synopsis-cache.json so re-runs only hit the network for misses.
 * Review the diff before committing — TMDB sometimes returns a remake or
 * a similarly named title for vintage/duplicate entries.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { transformWithOxc } from 'vite'

const API_KEY = process.env.TMDB_API_KEY
if (!API_KEY) {
  console.error('Missing TMDB_API_KEY. Get one free at https://www.themoviedb.org/settings/api')
  process.exit(1)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity
const cachePath = join(root, 'scripts/.synopsis-cache.json')
const outPath = join(root, 'src/data/synopses.ts')

/** Hand-verified TMDB ids for titles the search endpoint gets wrong. */
const TMDB_OVERRIDES = {
  // TMDB search returns the Wolverine anime for the Blade query.
  'animation-blade-anime-2011': { media: 'tv', tmdb: 62798 },
  // Shorts/web-series the search endpoint misses by title+year.
  'mcu-whih-newsfront-2015': { media: 'tv', tmdb: 69069 },
  'mcu-the-daily-bugle-2019': { media: 'tv', tmdb: 331074 },
  'marvel-tv-agents-of-s-h-i-e-l-d-slingshot-2016': { media: 'tv', tmdb: 69088 },
  'animation-pryde-of-the-x-men-1989': { media: 'tv', tmdb: 225656 },
  'animation-marvel-super-hero-adventures-frost-fight-2016': { media: 'movie', tmdb: 372631 },
  'animation-lego-marvel-avengers-climate-conundrum-2020': { media: 'tv', tmdb: 112851 },
  'animation-lego-marvel-avengers-strange-tails-2025': { media: 'tv', tmdb: 305165 },
  // 1978 Toei series premiered as a film-length pilot; TMDB only lists one entry.
  'legacy-spider-man-toei-1978': { media: 'movie', tmdb: 438561 },
  'legacy-spider-man-toei-film-1978': { media: 'movie', tmdb: 438561 },
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function tmdb(path, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3${path}`)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('language', 'en-US')
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))
  const response = await fetch(url)
  if (response.status === 429) {
    const retry = Number(response.headers.get('retry-after') || 2) * 1000
    await sleep(retry)
    return tmdb(path, params)
  }
  if (!response.ok) throw new Error(`TMDB ${response.status} for ${path}`)
  await sleep(250)
  return response.json()
}

const catalogSource = await readFile(join(root, 'src/data/catalog.ts'), 'utf8')
const logoManifestSource = await readFile(join(root, 'src/data/logoManifest.ts'), 'utf8')
const manifestLiteral = logoManifestSource.match(/export const logoManifest[^=]*= (\{[\s\S]*?\n\})/)?.[1] || '{}'
const shimmed = catalogSource.replace(
  /import \{ logoManifest \} from '\.\/logoManifest'\s*/g,
  `const logoManifest = ${manifestLiteral}\n`,
).replace(
  /import \{ synopses \} from '\.\/synopses'\s*/g,
  'const synopses = {}\n',
)
// catalog.ts is TypeScript; strip types via the repo's Vite transformer.
const shimmedJs = (await transformWithOxc(shimmed, join(root, 'src/data/catalog.ts'))).code
const shimPath = join(root, 'scripts/.catalog-shim.mjs')
await writeFile(shimPath, shimmedJs)
const { catalog } = await import(shimPath)

let cache = {}
try {
  cache = JSON.parse(await readFile(cachePath, 'utf8'))
} catch {
  cache = {}
}

const isSeries = (title) => title.format === 'Series' || (title.format === 'Special' && title.seasons !== undefined)
const results = {}
let fetched = 0
let cacheHits = 0
const misses = []

const targets = catalog.slice(0, limit)
for (const title of targets) {
  if (cache[title.id]?.overview) {
    results[title.id] = cache[title.id]
    cacheHits += 1
    continue
  }
  const override = TMDB_OVERRIDES[title.id]
  try {
    let detail
    if (override) {
      detail = await tmdb(`/${override.media}/${override.tmdb}`)
    } else {
      const media = isSeries(title) ? 'tv' : 'movie'
      const search = await tmdb(`/search/${media}`, {
        query: title.title,
        first_air_date_year: media === 'tv' ? title.year : undefined,
        year: media === 'movie' ? title.year : undefined,
      })
      const best = search.results?.[0]
      if (!best?.overview) {
        misses.push(title.id)
        continue
      }
      detail = best
    }
    const entry = { overview: detail.overview, tmdbId: detail.id }
    cache[title.id] = entry
    results[title.id] = entry
    fetched += 1
  } catch (error) {
    console.warn(`FAIL ${title.id}: ${error.message}`)
    misses.push(title.id)
  }
}

await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`)

const entries = Object.entries({ ...cache })
  .filter(([, entry]) => entry?.overview)
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([id, entry]) => `  ${JSON.stringify(id)}: ${JSON.stringify(entry.overview)}, // tmdb:${entry.tmdbId}`)

await writeFile(
  outPath,
  `/** Plot synopses (TMDB overviews) keyed by catalog id.\n *  Generated by scripts/fetch-synopses.mjs — do not hand-edit; re-run the script. */\nexport const synopses: Record<string, string> = {\n${entries.join('\n')}\n}\n`,
)

console.log(`synopses: ${entries.length} total (${fetched} fetched, ${cacheHits} cache hits)`)
if (misses.length) console.log(`misses (${misses.length}): ${misses.join(', ')}`)
