/**
 * 301s every page URL to its one canonical form: lowercase, single slashes, no
 * trailing slash. b10cks slugs are always lowercase, so `/About/` is only ever
 * a duplicate of `/about`, and so is `//about`. All fixes land in a single hop,
 * and the query string survives.
 *
 * Runs before `redirects.ts` (nitro orders middleware by filename), so CMS
 * redirects only ever see the canonical path. Static hosting (`nuxt generate`)
 * has no nitro at request time: do this at the CDN instead.
 */
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  // The raw path: `getRequestURL` already collapses leading slashes, which
  // would hide `//about` from the comparison below.
  const path = event.path.split('?', 1)[0] || '/'

  // Same exclusions as redirects.ts: assets, API and Nuxt internals are no
  // pages, and preview must never redirect.
  if (
    path === '/' ||
    path.startsWith('/api/') ||
    path.startsWith('/_nuxt/') ||
    path.startsWith('/__nuxt') ||
    path.includes('.') ||
    url.searchParams.has('b10cks_vid')
  ) {
    return
  }

  // Percent escapes keep their case: `%C3%BC` is how browsers send an umlaut,
  // and both cases mean the same byte.
  const canonical =
    path
      .replace(/%[0-9A-Fa-f]{2}|[A-Z]+/g, (match) =>
        match.startsWith('%') ? match : match.toLowerCase()
      )
      .replace(/\/{2,}/g, '/')
      .replace(/\/+$/, '') || '/'

  if (canonical !== path) {
    return sendRedirect(event, canonical + url.search, 301)
  }
})
