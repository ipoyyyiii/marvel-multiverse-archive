/**
 * Release and chronological cards use a small raster derivative so opening a
 * full universe does not decode the original multi-megapixel archive artwork.
 * The map and inspector continue to use the source logo path from the catalog.
 */
export const releaseLogoPath = (logo?: string) => {
  if (!logo) return undefined
  const filename = logo.split('/').pop()
  if (!filename) return logo
  return `/assets/logos/release/${filename.replace(/\.(?:svg|png|webp)$/i, '.png')}`
}
