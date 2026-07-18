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

export default defineNuxtRouteMiddleware(async (to) => {
  const { useRedirects } = useB10cksApi()
  const { data: redirects } = await useRedirects()

  if (staticRedirects[to.path] && !to.query.b10cks_vid) {
    const target = staticRedirects[to.path]
    return navigateTo(target + toQueryString(to.query))
  }

  const redirect = redirects.value && redirects.value[to.path]
  if (redirect && !to.query.b10cks_vid) {
    return navigateTo(redirect.target + toQueryString(to.query), {
      redirectCode: redirect.status_code,
    })
  }
})
