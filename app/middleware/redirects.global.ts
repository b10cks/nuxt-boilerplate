import type { LocationQuery } from 'vue-router'

const staticRedirects: { [key: string]: string } = {
  '/home': '/',
}

function toQueryString(query: LocationQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (entry != null) {
        params.append(key, entry)
      }
    }
  }
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * Static redirects only. The b10cks redirects are resolved by
 * `server/middleware/redirects.ts`: fetching the list here as well puts every
 * redirect of the space into each page's payload. A client-side navigation to
 * a redirected path ends in a 404, which `app/pages/[...slug].vue` reloads
 * from the server.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (staticRedirects[to.path] && !to.query.b10cks_vid) {
    const target = staticRedirects[to.path]
    return navigateTo(target + toQueryString(to.query))
  }
})
