import type { B10cksAsset, B10cksMeta } from '~/b10cks/types'

/** Raster images only: a lead field can hold a video, and crawlers ignore SVG. */
function isShareable(asset: B10cksAsset | null | undefined): asset is B10cksAsset {
  return !!asset?.mime_type?.startsWith('image/') && asset.mime_type !== 'image/svg+xml'
}

/**
 * Head tags and a WebPage schema.org node from a b10cks `meta` field.
 *
 * The title gets the site name from `_config` as a suffix, unless an editor
 * wrote the whole title into `meta.title`.
 *
 * The share image is the first raster image of `meta.ogImage`, the optional
 * `leadImage` and the `shareImage` on `_config`. This is the single place its
 * URL is built: always from the asset's `full_path` through the ilum provider,
 * never from its raw `url`, so the shared card is a fixed 1200x630 crop rather
 * than the original upload. Also emits the canonical link and og:url.
 */
export function useB10cksSeo(
  meta: () => B10cksMeta | undefined,
  fallbackTitle: () => string,
  leadImage?: () => B10cksAsset | null | undefined
) {
  const $img = useImage()
  const site = useSiteConfig()
  const requestOrigin = useRequestURL().origin
  const route = useRoute()
  const config = useB10cksSiteConfig()

  const title = () => {
    const siteName = config.value.siteName
    return meta()?.title || (siteName ? `${fallbackTitle()} | ${siteName}` : fallbackTitle())
  }

  const shareImage = computed(() => {
    const asset = [meta()?.ogImage, leadImage?.(), config.value.shareImage].find(isShareable)
    return asset
      ? $img(asset.full_path, { width: 1200, height: 630 }, { provider: 'ilum' })
      : undefined
  })

  // Self-referencing and query-free, so `?drawer=`, tracking and preview params
  // never split the page. An editor's `meta.canonical` wins: absolute URLs as
  // is, paths resolved on the site origin.
  const canonical = computed(() => {
    const custom = meta()?.canonical?.trim()
    if (custom && /^https?:\/\//.test(custom)) {
      return custom
    }

    return siteUrl(site.url || requestOrigin, custom || route.path)
  })

  useHead({ link: [{ rel: 'canonical', href: canonical }] })

  // Getters, so the head tags follow live preview edits.
  useSeoMeta({
    ogUrl: canonical,
    title,
    description: () => meta()?.description,
    ogTitle: () => meta()?.ogTitle || meta()?.title || fallbackTitle(),
    ogDescription: () => meta()?.ogDescription || meta()?.description,
    ogImage: shareImage,
    ogImageWidth: () => (shareImage.value ? 1200 : undefined),
    ogImageHeight: () => (shareImage.value ? 630 : undefined),
    robots: () => meta()?.robots,
  })

  // schema.org nodes resolve once, at setup.
  useSchemaOrg([
    defineWebPage({
      name: meta()?.title || fallbackTitle(),
      description: meta()?.description,
      primaryImageOfPage: shareImage.value,
    }),
  ])
}
