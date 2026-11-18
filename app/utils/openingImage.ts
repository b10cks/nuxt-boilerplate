import type { IlumModifiers } from '~/utils/providers/ilum'

interface ImageRequest {
  sizes?: string
  modifiers: IlumModifiers
}

type ImageCandidates = ReturnType<ReturnType<typeof useImage>['getSizes']>

/**
 * Returns a function that builds the candidates `NuxtImg` renders for the same
 * `sizes` and modifiers, for a `<source>` or a preload link.
 */
export function useImageCandidates() {
  const img = useImage()
  return (src: string, { sizes, modifiers }: ImageRequest): ImageCandidates =>
    img.getSizes(src, { sizes, modifiers: { ...modifiers, quality: img.options.quality } })
}

/**
 * Preloads the image a page opens with. The link has to name the same
 * candidates as the tag, or the browser downloads the image twice. `NuxtImg`'s
 * own `preload` leaves the srcset out and would fetch the largest file.
 *
 * `media` is for an image with several sources: the query its `<source>` or
 * `<img>` applies under, so each viewport preloads only the file it shows.
 */
export function usePreloadImage({ src, srcset, sizes }: ImageCandidates, media?: string) {
  if (!import.meta.server) return

  useHead({
    link: [
      {
        rel: 'preload',
        as: 'image',
        href: src,
        imagesrcset: srcset,
        imagesizes: sizes,
        media,
        fetchpriority: 'high',
        // Ahead of the inlined styles, behind the preconnect.
        tagPriority: 25,
      },
    ],
  })
}

/**
 * The CMS focus point as a CSS `object-position`. It steers `object-cover`,
 * which re-crops whenever the box differs from the requested ratio.
 */
export function focusPosition(point: unknown): string | undefined {
  if (typeof point !== 'object' || point === null || !('x' in point) || !('y' in point)) return
  return typeof point.x === 'number' && typeof point.y === 'number'
    ? `${point.x}% ${point.y}%`
    : undefined
}
