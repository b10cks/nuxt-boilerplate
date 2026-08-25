import { filterSitemapEntries, renderSitemapXml } from '@b10cks/client'

/**
 * Every published, indexable page. `filterSitemapEntries` drops `noindex`
 * entries and deduplicates by absolute URL; `renderSitemapXml` emits the
 * `<urlset>`.
 *
 * Note that URLs are prefixed with the entry's `language_iso` when the space
 * has one set, matching `strategy: 'prefix'`. Pass a `locale` to
 * `filterSitemapEntries` if a single language should be published.
 *
 * For a larger space, split this into a `<sitemapindex>` (see
 * `renderSitemapIndex`) with one child per language or content section, so a
 * single new entry does not invalidate the crawl of the stable URLs.
 */
export default defineEventHandler(async (event) => {
  const api = await createServerB10cksApi(event)
  const siteUrl = resolveSiteUrl(event)

  const entries = await api.getSitemap({}, { allPages: true })
  const xml = renderSitemapXml(filterSitemapEntries(entries, { siteUrl }), siteUrl)

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'max-age=180, s-maxage=86400, public')

  return xml
})
