import { getQuery } from 'h3'

/**
 * Keeps draft previews out of every cache. The `/**` route rule gives each
 * response the public page cache header, which must not apply to unpublished
 * content.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response, { event }) => {
    if ('b10cks_vid' in getQuery(event)) {
      response.headers = { ...response.headers, 'cache-control': 'no-store' }
    }
  })
})
