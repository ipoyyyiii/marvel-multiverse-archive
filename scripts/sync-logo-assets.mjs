import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformWithOxc } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const catalogPath = join(root, 'src/data/catalog.ts')
const manifestPath = join(root, 'src/data/logoManifest.ts')
const logoDir = join(root, 'public/assets/logos')
const reportPath = join(logoDir, 'logo-sync-report.md')
const userAgent = 'MarvelMultiverseArchive/1.0 (private archive asset audit)'
// Commons asks clients to stay below its request limit. A single worker with
// backoff is slower but avoids a burst that would turn the rest of the audit
// into false "missing" results.
const concurrency = 1
const requestDelay = 1100

const slugify = (value) => value
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[’']/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const significantTokens = (title) => slugify(title)
  .split('-')
  .filter((token) => !['the', 'a', 'an', 'of', 'and', 'to', 'for', 'in', 'on', 'vol', 'season', 'series'].includes(token))

async function importTypeScript(filePath) {
  let source = await readFile(filePath, 'utf8')
  // The catalog normally has no runtime imports. If the generated manifest is
  // already wired in, inline it so this one-off audit remains rerunnable from
  // Node without a TS loader.
  if (source.includes("from './logoManifest'")) {
    const manifestSource = await readFile(manifestPath, 'utf8')
    const literal = manifestSource.match(/export const logoManifest[^=]*= (\{[\s\S]*?\n\})/)?.[1] || '{}'
    source = source.replace(/import \{ logoManifest \} from '\.\/logoManifest'\s*/g, `const logoManifest = ${literal}\n`)
  }
  const { code } = await transformWithOxc(source, filePath)
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
}

async function exists(filePath) {
  try { await access(filePath); return true } catch { return false }
}

async function commonsSearch(title) {
  const queries = [`${title} logo`, `${title} movie logo`]
  for (const query of queries) {
    let data
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const params = new URLSearchParams({
        action: 'query', format: 'json', origin: '*', maxlag: '5', generator: 'search',
        gsrsearch: query, gsrnamespace: '6', gsrlimit: '10',
        prop: 'imageinfo', iiprop: 'url|mime|size', iiurlwidth: '1800',
      })
      const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
        headers: { 'User-Agent': userAgent, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      if (response.status === 429 || response.status === 503) {
        const retryAfter = Number(response.headers.get('retry-after'))
        const retryWait = Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 5000) : 0
        await sleep(Math.max(2000 * (attempt + 1), retryWait))
        continue
      }
      if (!response.ok) throw new Error(`Commons ${response.status}`)
      data = await response.json()
      break
    }
    if (!data) throw new Error('Commons rate limit persisted after retries')
    const pages = Object.values(data.query?.pages || {})
    const candidates = pages.map((page) => ({ page, info: page.imageinfo?.[0] })).filter(({ info }) => (
      info && ['image/svg+xml', 'image/png', 'image/webp'].includes(info.mime)
    ))
    const ranked = candidates.map(({ page, info }) => {
      const filename = page.title.replace(/^File:/i, '').toLowerCase()
      const haystack = `${filename} ${page.descriptionurl || ''}`
      const tokens = significantTokens(title)
      let score = filename.includes('logo') ? 50 : 0
      if (filename.includes('title')) score += 16
      if (filename.includes('movie') || filename.includes('film') || filename.includes('series')) score += 8
      if (/poster|cover|wallpaper|screenshot|font|icon|symbol|character|cosplay|fan.?art/.test(filename)) score -= 70
      score += tokens.reduce((total, token) => total + (haystack.includes(token) ? 15 : 0), 0)
      return { page, info, score }
    }).sort((a, b) => b.score - a.score)
    const best = ranked.find((candidate) => candidate.score >= 62 && significantTokens(title).some((token) => candidate.page.title.toLowerCase().includes(token)))
    if (best) return best
  }
  return null
}

async function downloadCandidate(candidate, filename) {
  const { info } = candidate
  // Wikimedia's original upload host can return a 429 for scripted clients,
  // while the generated thumbnail is stable and already capped to a sensible
  // logo resolution. Prefer the thumbnail for every format and store it as a
  // local PNG; fall back to the original only when no thumbnail exists.
  const downloadUrl = info.thumburl || info.url
  let response
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt === 0) await sleep(900)
    response = await fetch(downloadUrl, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(8000) })
    if (response.status !== 429 && response.status !== 503) break
    const retryAfter = Number(response.headers.get('retry-after'))
    const retryWait = Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 5000) : 0
    await sleep(Math.max(2000 * (attempt + 1), retryWait))
  }
  if (!response) throw new Error('Asset request did not return')
  if (!response.ok) throw new Error(`Asset ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length < 200) throw new Error('Asset was unexpectedly empty')
  const extension = info.thumburl ? 'png' : info.mime === 'image/webp' ? 'webp' : info.mime === 'image/svg+xml' ? 'svg' : 'png'
  const target = join(logoDir, `${filename}.${extension}`)
  await writeFile(target, bytes)
  return { target, extension, downloadUrl }
}

async function existingMappings(source) {
  const block = source.match(/const logoByTitle[^=]*= \{([\s\S]*?)\n\}/)?.[1] || ''
  const mapping = new Map([...block.matchAll(/'([^']+)':\s*'([^']+)'/g)].map((match) => [match[1], match[2]]))
  if (!mapping.size && source.includes("from './logoManifest'")) {
    const manifestSource = await readFile(manifestPath, 'utf8')
    for (const match of manifestSource.matchAll(/"([^\"]+)":\s*"([^\"]+)"/g)) mapping.set(match[1], match[2])
  }
  return mapping
}

function writeManifest(mapping) {
  const lines = [...mapping.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`)
  return `// Generated by scripts/sync-logo-assets.mjs. Keep title keys in universe:title form.\nexport const logoManifest: Record<string, string> = {\n${lines.join('\n')}\n}\n`
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const catalogModule = await importTypeScript(catalogPath)
const catalogSource = await readFile(catalogPath, 'utf8')
const catalog = catalogModule.catalog
await mkdir(logoDir, { recursive: true })

const mapping = await existingMappings(catalogSource)
const results = []
const missing = []
const queue = catalog.filter((title) => !mapping.has(`${title.universeId}:${title.title}`))
const searchCache = new Map()
let cursor = 0

async function worker() {
  while (cursor < queue.length) {
    const title = queue[cursor]
    cursor += 1
      const key = `${title.universeId}:${title.title}`
    try {
      const prefix = `${title.universeId}-${slugify(title.title)}`
      let existingExtension
      for (const extension of ['svg', 'png', 'webp']) {
        if (await exists(join(logoDir, `${prefix}.${extension}`))) {
          existingExtension = extension
          break
        }
      }
      if (existingExtension) {
        const publicPath = `/assets/logos/${prefix}.${existingExtension}`
        mapping.set(key, publicPath)
        results.push({ title, key, publicPath, source: 'existing partial asset', url: '' })
        console.log(`KEEP  ${key} -> ${publicPath}`)
        continue
      }
      let candidate = searchCache.get(title.title)
      if (candidate === undefined) {
        console.log(`SEARCH ${key}`)
        candidate = await commonsSearch(title.title)
        searchCache.set(title.title, candidate || null)
      }
      if (!candidate) {
        missing.push({ title, reason: 'No high-confidence Wikimedia Commons logo candidate' })
        console.log(`MISS  ${key}`)
        continue
      }
      const downloaded = await downloadCandidate(candidate, prefix)
      const publicPath = `/assets/logos/${prefix}.${downloaded.extension}`
      mapping.set(key, publicPath)
      results.push({ title, key, publicPath, source: candidate.page.imageinfo?.[0]?.descriptionurl || candidate.page.title, url: downloaded.downloadUrl })
      console.log(`OK    ${key} -> ${publicPath}`)
    } catch (error) {
      missing.push({ title, reason: error instanceof Error ? error.message : String(error) })
      console.log(`ERROR ${key} -> ${error instanceof Error ? error.message : String(error)}`)
    }
    await sleep(requestDelay)
  }
}

await Promise.all(Array.from({ length: concurrency }, worker))
await writeFile(manifestPath, writeManifest(mapping))

const report = [
  '# Logo asset sync report',
  '',
  `Generated ${new Date().toISOString().slice(0, 10)} from Wikimedia Commons search results.`,
  '',
  `- Catalog records checked: ${catalog.length}`,
  `- Existing mappings preserved: ${catalog.length - queue.length}`,
  `- New local assets downloaded: ${results.length}`,
  `- Titles still missing a high-confidence logo: ${missing.length}`,
  '',
  '## Newly downloaded assets',
  '',
  ...results.map((result) => `- **${result.title.title}** (${result.title.universeId}) → \`${result.publicPath}\` · [source](${result.source})`),
  '',
  '## Needs manual lookup',
  '',
  ...(missing.length ? missing.map(({ title, reason }) => `- **${title.title}** (${title.universeId}) — ${reason}`) : ['None']),
  '',
  'Search results are candidates for a private local archive and should be reviewed before redistribution. Keep source and license information with any asset you retain.',
  '',
].join('\n')
await writeFile(reportPath, report)
console.log(`\nChecked ${catalog.length} titles: ${results.length} downloaded, ${missing.length} missing.`)
