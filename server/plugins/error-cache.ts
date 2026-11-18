import { setResponseHeader } from 'h3'

/**
 * Keeps error responses out of every cache.
 *
 * The `/**` route rule gives each response the public page cache header, so a
 * failed page could otherwise stay at the CDN for up to a day. Nuxt renders the
 * error page through the internal `/__nuxt_error` route and copies that
 * response's headers, which is why the path is checked next to the status. The
 * `error` hook covers errors from server routes. Nitro answers a 404 that
 * renders no page (a missing asset, a JSON request) with `no-cache` by itself.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response, { event }) => {
    const isError = (response.statusCode ?? 200) >= 400 || event.path.startsWith('/__nuxt_error')
    if (isError) {
      response.headers = { ...response.headers, 'cache-control': 'no-store' }
    }
  })

  nitroApp.hooks.hook('error', (_error, { event }) => {
    if (event) {
      setResponseHeader(event, 'cache-control', 'no-store')
    }
  })
})
