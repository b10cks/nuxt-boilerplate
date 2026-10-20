/**
 * Absolute URL of a site path, in the one form canonical, hreflang, og:url and
 * the sitemap all agree on: never a trailing slash, except on the root.
 */
export function siteUrl(origin: string, path: string): string {
  return new URL(path.replace(/\/+$/, '') || '/', origin).toString()
}
