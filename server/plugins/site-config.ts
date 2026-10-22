/**
 * Resolves nuxt-site-config's `url` per request from `resolveSiteUrl`, the
 * same origin robots.txt and the sitemap use. Every schema.org `@id` and `url`
 * follows it.
 *
 * `site.url` in nuxt.config.ts would be baked in at build time, so a build
 * without NUXT_PUBLIC_APP_URL ships `localhost` into every structured data
 * node. `runtimeConfig.public.siteUrl` can still be set at boot through
 * NUXT_PUBLIC_SITE_URL.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('site-config:init', ({ event, siteConfig }) => {
    siteConfig.push({
      _context: 'app',
      // Above `runtime` (0), so it outranks the request origin on the server
      // and survives client rehydration, which maps 0 to -1.
      _priority: 1,
      url: resolveSiteUrl(event),
    })
  })
})
