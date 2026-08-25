import type { B10cksMeta } from '~/b10cks/types'

/**
 * Head tags and a WebPage schema.org node from a b10cks `meta` field.
 *
 * The single place the OG image URL is built: always from the asset's
 * `full_path` through the ilum provider, never from its raw `url`, so the
 * shared card is a fixed 1200x630 crop rather than the original upload.
 */
export function useB10cksSeo(meta: () => B10cksMeta | undefined, fallbackTitle: () => string) {
  const $img = useImage()

  const toOgImage = (asset: B10cksMeta['ogImage']) =>
    asset ? $img(asset.full_path, { width: 1200, height: 630 }, { provider: 'ilum' }) : undefined

  // Getters, so the head tags follow live preview edits.
  useSeoMeta({
    title: () => meta()?.title || fallbackTitle(),
    description: () => meta()?.description,
    ogTitle: () => meta()?.ogTitle || meta()?.title || fallbackTitle(),
    ogDescription: () => meta()?.ogDescription || meta()?.description,
    ogImage: () => toOgImage(meta()?.ogImage),
    robots: () => meta()?.robots,
  })

  // schema.org nodes resolve once, at setup.
  useSchemaOrg([
    defineWebPage({
      name: meta()?.title || fallbackTitle(),
      description: meta()?.description,
      primaryImageOfPage: toOgImage(meta()?.ogImage),
    }),
  ])
}
