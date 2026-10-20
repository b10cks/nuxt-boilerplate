import type { B10cksDataApi, IBSitemapEntry } from '@b10cks/client'
import { filterSitemapEntries } from '@b10cks/client'

/**
 * Every published, indexable page: the one list sitemap.xml and llms.txt both
 * publish. `filterSitemapEntries` drops `noindex` entries and deduplicates by
 * absolute URL. Fragments (`_config`, `_drawers/…`) are dropped too, because
 * the page renders them noindex.
 */
export async function fetchIndexablePages(
  api: B10cksDataApi,
  siteUrl: string
): Promise<IBSitemapEntry[]> {
  const entries = await api.getSitemap({}, { allPages: true })

  return filterSitemapEntries(entries, { siteUrl }).filter(
    (entry) => !isFragmentSlug(entry.full_slug)
  )
}
