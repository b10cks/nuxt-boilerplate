import type { RedirectMap } from '@b10cks/client'
import type { H3Event } from 'h3'

/**
 * CMS redirects, applied on the server so the first hit gets a real, cacheable
 * 301 instead of a client-side navigation after the page has already rendered.
 *
 * `app/middleware/redirects.global.ts` stays: it catches in-app navigations,
 * which never reach nitro, and holds the static redirect map.
 */
const CACHE_TTL_MS = 5 * 60 * 1000

let cache: { map: RedirectMap; expiresAt: number } | undefined

async function loadRedirects(event: H3Event): Promise<RedirectMap> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.map
  }

  const api = await createServerB10cksApi(event)
  const map = await api.getRedirects({}, { allPages: true })
  cache = { map, expiresAt: Date.now() + CACHE_TTL_MS }

  return map
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  // Assets, API and Nuxt internals are never redirect sources. A dot in the
  // last segment is the cheap test for "this is a file, not a page".
  if (
    path.startsWith('/api/') ||
    path.startsWith('/_nuxt/') ||
    path.startsWith('/__nuxt') ||
    path.includes('.')
  ) {
    return
  }

  // Preview must never redirect: an editor opening a draft of a page that also
  // has a redirect would be bounced away from the page they are editing.
  if (url.searchParams.has('b10cks_vid')) {
    return
  }

  try {
    const redirect = (await loadRedirects(event))[path]
    if (redirect) {
      return sendRedirect(event, redirect.target, redirect.status_code || 301)
    }
  } catch {
    // A redirect lookup failure must not take the page down.
  }
})
