import type { B10cksDataApi, IBSitemapEntry } from '@b10cks/client'
import { buildLocalizedPath, filterSitemapEntries } from '@b10cks/client'

/**
 * Whether an editor's `meta.canonical` names another page. Every form the
 * entry's own URL can take counts as self-referencing: with or without the
 * language prefix, and `/home` for the root. Case is ignored because
 * `canonical-path.ts` 301s uppercase paths to lowercase.
 */
function hasForeignCanonical(entry: IBSitemapEntry, origin: string): boolean {
  const canonical = entry.meta?.canonical?.trim()
  if (!canonical || !URL.canParse(canonical, origin)) {
    return false
  }

  const ownPaths = [
    `/${entry.full_slug.replace(/^\/+/, '')}`,
    buildLocalizedPath(entry.full_slug, null),
    buildLocalizedPath(entry.full_slug, entry.language_iso),
  ]
  const target = siteUrl(origin, canonical).toLowerCase()

  return !ownPaths.some((path) => siteUrl(origin, path).toLowerCase() === target)
}

/**
 * Every published, indexable page: the one list sitemap.xml and llms.txt both
 * publish. `filterSitemapEntries` drops `noindex` entries and deduplicates by
 * absolute URL. Fragments (`_config`, `_drawers/…`) are dropped too, because
 * the page renders them noindex, and so are entries whose canonical names
 * another URL, because only that URL should be indexed.
 */
export async function fetchIndexablePages(
  api: B10cksDataApi,
  origin: string
): Promise<IBSitemapEntry[]> {
  const entries = await api.getSitemap({}, { allPages: true })

  return filterSitemapEntries(entries, { siteUrl: origin }).filter(
    (entry) => !isFragmentSlug(entry.full_slug) && !hasForeignCanonical(entry, origin)
  )
}
