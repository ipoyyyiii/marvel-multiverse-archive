/**
 * Every catalog logo has a bounded raster derivative prepared under
 * `public/assets/logos/release`. The same derivative is safe for release
 * cards, the map, search results, and the inspector: those surfaces never
 * render a logo larger than the 640px preparation limit.
 *
 * Keeping this choice in one helper is important. A new logo should not
 * accidentally make the map decode a multi-megapixel source image again.
 */
export const releaseLogoPath = (logo?: string) => {
  if (!logo) return undefined
  const filename = logo.split('/').pop()
  if (!filename) return logo
  return `/assets/logos/release/${filename.replace(/\.(?:svg|png|webp)$/i, '.png')}`
}

/** Shared bounded asset path for non-release archive surfaces. */
export const archiveLogoPath = releaseLogoPath
