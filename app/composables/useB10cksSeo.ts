import type { B10cksMeta } from '~/b10cks/types'

/**
 * Head tags and a WebPage schema.org node from a b10cks `meta` field.
 *
 * The single place the OG image URL is built: always from the asset's
 * `full_path` through the ilum provider, never from its raw `url`, so the
 * shared card is a fixed 1200x630 crop rather than the original upload. Also
 * emits the canonical link and og:url.
 */
export function useB10cksSeo(meta: () => B10cksMeta | undefined, fallbackTitle: () => string) {
  const $img = useImage()
  const site = useSiteConfig()
  const requestOrigin = useRequestURL().origin
  const route = useRoute()

  const toOgImage = (asset: B10cksMeta['ogImage']) =>
    asset ? $img(asset.full_path, { width: 1200, height: 630 }, { provider: 'ilum' }) : undefined

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
