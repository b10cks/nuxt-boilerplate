import type { IBBreadcrumbLevel, IBContent } from '@b10cks/client'

/**
 * A `BreadcrumbList` schema.org node from the content tree: the home page, every
 * ancestor that is a page, and the entry itself. Folders only add a slug
 * segment, and the home page and fragments get no trail.
 *
 * Structured data only renders on the server (nuxt-schema-org is not reactive in
 * production), so the trail is fetched there and never reaches the payload.
 */
export function useBreadcrumbSchema(content: Pick<IBContent, 'full_slug' | 'language_iso'>) {
  const slug = content.full_slug.replace(/^\/+/, '')
  if (import.meta.client || slug === 'home' || isFragmentSlug(slug)) {
    return
  }

  const nuxtApp = useNuxtApp()
  const { dataApi } = useB10cksApi()
  const version = useB10cksVersion()
  const route = useRoute()
  const site = useSiteConfig()
  const origin = site.url || useRequestURL().origin
  const homeName = useB10cksSiteConfig().value.siteName || site.name

  // Whatever the URL carries before the slug, the language prefix when i18n is on.
  const prefix = route.path.endsWith(`/${slug}`) ? route.path.slice(0, -slug.length - 1) : ''

  onServerPrefetch(async () => {
    const levels: IBBreadcrumbLevel[] = await dataApi
      .getBreadcrumb(slug, {
        language_iso: content.language_iso,
        // The endpoint takes no version id: every preview reads drafts.
        vid: version.value === 'published' ? 'published' : 'draft',
      })
      // A page without a trail is better than a page that fails.
      .catch(() => [])

    const crumbs = levels
      .filter((level) => level.block !== 'folder' && level.full_slug.replace(/^\/+/, '') !== 'home')
      .map((level) => ({
        name: level.name,
        path: `${prefix}/${level.full_slug.replace(/^\/+/, '')}`,
      }))
    const trail = homeName ? [{ name: homeName, path: prefix || '/' }, ...crumbs] : crumbs
    if (trail.length < 2) {
      return
    }

    // The await above lost the Nuxt context `useHead` reads.
    nuxtApp.runWithContext(() =>
      useSchemaOrg([
        defineBreadcrumb({
          itemListElement: trail.map(({ name, path }) => ({ name, item: siteUrl(origin, path) })),
        }),
      ])
    )
  })
}
