/** False for paths that are no pages: files, API routes and Nuxt internals. */
export function isPagePath(path: string): boolean {
  return !path.includes('.') && !/^\/(?:api\/|_nuxt\/|__nuxt)/.test(path)
}

/**
 * The URL a page answers on: lowercase, single slashes, no trailing slash, and
 * `/` for the `home` entry. Follows server/middleware/canonical-path.ts, so an
 * internal link never costs a 301. Paths that middleware leaves alone (files,
 * API, Nuxt internals) stay as they are.
 */
export function internalPath(path: string): string {
  const absolute = path.startsWith('/') ? path : `/${path}`
  if (!isPagePath(absolute)) {
    return absolute
  }

  // Percent escapes keep their case: both cases mean the same byte.
  const canonical =
    absolute
      .replace(/%[0-9A-Fa-f]{2}|[A-Z]+/g, (match) =>
        match.startsWith('%') ? match : match.toLowerCase()
      )
      .replace(/\/{2,}/g, '/')
      .replace(/\/+$/, '') || '/'

  return canonical === '/home' ? '/' : canonical
}

/**
 * Applies `internalPath` to the path of a link, keeping its query and hash.
 * External URLs, `mailto:` and the like, and a bare `?query` or `#hash` pass
 * through unchanged.
 */
export function internalHref(href: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) {
    return href
  }
  return href.replace(/^[^?#]+/, (path) => internalPath(path))
}
