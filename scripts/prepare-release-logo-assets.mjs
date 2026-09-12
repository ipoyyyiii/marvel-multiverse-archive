import { access, mkdir, readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const manifestPath = join(root, 'src/data/logoManifest.ts')
const outputDir = join(root, 'public/assets/logos/release')

const manifest = await readFile(manifestPath, 'utf8')
const sourcePaths = [...manifest.matchAll(/: "(\/assets\/logos\/[^\"]+)"/g)]
  .map((match) => match[1])
const uniquePaths = [...new Set(sourcePaths)]

await mkdir(outputDir, { recursive: true })

let prepared = 0
let skipped = 0
for (const publicPath of uniquePaths) {
  const source = join(root, 'public', publicPath)
  const filename = basename(publicPath).replace(/\.(?:svg|png|webp)$/i, '.png')
  const target = join(outputDir, filename)

  try {
    await access(source)
    // Release cards render at roughly 150–220 CSS px. 640px leaves room for
    // high-DPI displays without shipping multi-megapixel artwork to the grid.
    execFileSync('sips', ['-s', 'format', 'png', '-Z', '640', source, '--out', target], { stdio: 'ignore' })
    prepared += 1
  } catch {
    skipped += 1
    console.warn(`SKIP ${publicPath}`)
  }
}

console.log(`Prepared ${prepared} release logos in public/assets/logos/release (${skipped} skipped).`)
