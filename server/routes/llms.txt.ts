import { buildLocalizedPath } from '@b10cks/client'

/**
 * llms.txt (https://llmstxt.org): the editor's summary from the `_llms`
 * content entry (its `# Title` and `> summary` lines included), followed by
 * every indexable page from the same list as sitemap.xml, so noindex pages
 * stay out here too.
 */
export default defineEventHandler(async (event) => {
  const api = await createServerB10cksApi(event)
  const origin = resolveSiteUrl(event)

  const [intro, pages] = await Promise.all([
    api
      .getContent<{ content?: string }>('_llms')
      .then((entry) => entry.content?.content?.trim() || '')
      // The _llms entry does not exist in this space yet.
      .catch(() => ''),
    fetchIndexablePages(api, origin),
  ])

  const lines = [
    ...(intro ? [intro, ''] : []),
    '## Pages',
    '',
    ...pages.map(
      (page) =>
        `- [${page.name}](${siteUrl(origin, buildLocalizedPath(page.full_slug, page.language_iso))})`
    ),
    '',
    '## Optional',
    '',
    `- [Sitemap](${origin}/sitemap.xml)`,
  ]

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'max-age=180, s-maxage=86400, public')

  return lines.join('\n') + '\n'
})
