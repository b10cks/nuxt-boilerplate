import type { RedirectMap } from '@b10cks/client'
import type { H3Event } from 'h3'

/**
 * CMS redirects, applied on the server so the first hit gets a real, cacheable
 * 301 instead of a client-side navigation after the page has already rendered.
 *
 * This is the only place that knows the list. The app must not fetch it:
 * `useRedirects` in a route middleware or component puts every redirect of the
 * space into each page's payload. An in-app navigation to a redirected path
 * ends in a 404, which `app/pages/[...slug].vue` reloads from here.
 * `app/middleware/redirects.global.ts` holds the static redirect map.
 */
const CACHE_TTL_MS = 5 * 60 * 1000
const RETRY_AFTER_FAILURE_MS = 30 * 1000
const LOOKUP_TIMEOUT_MS = 10 * 1000

let cache: { map: RedirectMap; expiresAt: number } | undefined
let lookup: Promise<RedirectMap> | undefined

async function fetchRedirects(event: H3Event): Promise<RedirectMap> {
  const api = await createServerB10cksApi(event)
  return collapseRedirects(await api.getRedirects({}, { allPages: true }))
}

/** Every request waits on the shared lookup, so one that hangs must not wait forever. */
function withTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Redirect lookup timed out')), LOOKUP_TIMEOUT_MS)
  })

  return Promise.race([work, timeout]).finally(() => clearTimeout(timer))
}

/**
 * Keeps the last good map through an outage and asks again after a short
 * pause, so requests do not queue up behind a CMS that is down. Never rejects.
 */
async function refreshRedirects(event: H3Event): Promise<RedirectMap> {
  try {
    const map = await withTimeout(fetchRedirects(event))
    cache = { map, expiresAt: Date.now() + CACHE_TTL_MS }
  } catch {
    cache = { map: cache?.map ?? {}, expiresAt: Date.now() + RETRY_AFTER_FAILURE_MS }
  }

  return cache.map
}

/** A burst on a cold or expired cache shares one lookup. */
function loadRedirects(event: H3Event): RedirectMap | Promise<RedirectMap> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.map
  }

  lookup ??= refreshRedirects(event).finally(() => {
    lookup = undefined
  })

  return lookup
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

  const redirect = (await loadRedirects(event))[path]
  if (redirect) {
    // The query string travels along (campaign parameters, `?drawer=`).
    const query = url.search.slice(1)
    const separator = redirect.target.includes('?') ? '&' : '?'
    const target = query ? `${redirect.target}${separator}${query}` : redirect.target
    return sendRedirect(event, target, redirect.status_code || 301)
  }
})
