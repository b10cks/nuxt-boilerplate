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

  const { codes } = localeSettings(useRuntimeConfig(event).public)
  const [intro, { pages, localePrefix }] = await Promise.all([
    api
      .getContent<{ content?: string }>('_llms')
      .then((entry) => entry.content?.content?.trim() || '')
      // The _llms entry does not exist in this space yet.
      .catch(() => ''),
    fetchIndexablePages(api, origin, codes),
  ])

  const lines = [
    ...(intro ? [intro, ''] : []),
    '## Pages',
    '',
    ...pages.map((page) => {
      const language = localePrefix === 'always' ? page.language_iso : null
      return `- [${page.name}](${siteUrl(origin, buildLocalizedPath(page.full_slug, language))})`
    }),
    '',
    '## Optional',
    '',
    `- [Sitemap](${origin}/sitemap.xml)`,
  ]

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'max-age=180, s-maxage=86400, public')

  return lines.join('\n') + '\n'
})
