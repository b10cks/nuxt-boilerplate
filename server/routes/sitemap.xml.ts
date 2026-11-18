import { renderSitemapXml } from '@b10cks/client'

/**
 * Every published, indexable page (`fetchIndexablePages`) as a `<urlset>`.
 *
 * URLs carry the entry's `language_iso` as `fetchIndexablePages` decides. Pass
 * a `locale` to `filterSitemapEntries` there if a single language should be
 * published.
 *
 * For a larger space, split this into a `<sitemapindex>` (see
 * `renderSitemapIndex`) with one child per language or content section, so a
 * single new entry does not invalidate the crawl of the stable URLs.
 */
export default defineEventHandler(async (event) => {
  const api = await createServerB10cksApi(event)
  const siteUrl = resolveSiteUrl(event)

  const { codes } = localeSettings(useRuntimeConfig(event).public)
  const { pages, localePrefix } = await fetchIndexablePages(api, siteUrl, codes)
  const xml = renderSitemapXml(pages, siteUrl, { localePrefix })

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'max-age=180, s-maxage=86400, public')

  return xml
})
