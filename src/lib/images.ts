import type { ImageMetadata } from 'astro'
import { getImage } from 'astro:assets'

const modules = import.meta.glob<{ default: ImageMetadata }>('/src/assets/imgs/**/*', {
  eager: true,
})

/** Resolve a frontmatter/public-style path like `imgs/foo.png` to an asset import. */
export function resolveAsset(path: string | undefined): ImageMetadata | undefined {
  if (!path)
    return undefined
  const file = path
    .replace(/^\/+/, '')
    .replace(/^imgs\//, '')
    .replace(/^www\//, '')
  const key = Object.keys(modules).find(k => k.endsWith(`/imgs/${file}`) || k.endsWith(`/${file}`))
  if (!key && path.length > 0)
    console.warn(`[images] no asset found for "${path}" — checked src/assets/imgs/. Image will resolve to its raw URL.`)
  return key ? modules[key]?.default : undefined
}

export async function optimizeAsset(
  pathOrMeta: string | ImageMetadata,
  opts: { width?: number, height?: number, format?: 'webp' | 'avif' | 'jpeg' | 'png' } = {},
) {
  const src = typeof pathOrMeta === 'string' ? resolveAsset(pathOrMeta) : pathOrMeta
  if (!src)
    return undefined

  // SVGs: serve the imported URL as-is (no raster re-encode).
  if (src.format === 'svg')
    return { src: src.src, attributes: { width: src.width, height: src.height } }

  const { width = 1200, format = 'webp', height } = opts
  return getImage({
    src,
    width,
    ...(height ? { height } : {}),
    format,
  })
}
