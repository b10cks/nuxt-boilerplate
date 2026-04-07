const staticRedirects: { [key: string]: string } = {
  '/home': '/',
}

export default defineNuxtRouteMiddleware(async (to) => {
  const { useRedirects } = useB10cksApi()
  const { data: redirects } = await useRedirects()

  if (staticRedirects[to.path] && !to.query.b10cks_vid) {
    const target = staticRedirects[to.path]
    const queryString =
      to.query && Object.keys(to.query).length > 0
        ? '?' + new URLSearchParams(to.query).toString()
        : ''
    return navigateTo(target + queryString)
  }

  const redirect = redirects.value && redirects.value[to.path]
  if (redirect && !to.query.b10cks_vid) {
    const target = redirect.target
    const queryString =
      to.query && Object.keys(to.query).length > 0
        ? '?' + new URLSearchParams(to.query).toString()
        : ''
    return navigateTo(target + queryString, { statusCode: redirect.status_code })
  }
})
