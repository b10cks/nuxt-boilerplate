/**
 * Nuxt hydrates the route recorded in `payload.path` whenever it differs from
 * the address bar, query included, and replaces the browser URL with it. A page
 * cached at the CDN is shared by every visitor of its path, so a query recorded
 * there would overwrite each visitor's own (utm_*, gclid). Recording the path
 * alone lets the address bar's query stand.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.payload.path = nuxtApp.payload.path?.replace(/[?#].*$/, '')
})
