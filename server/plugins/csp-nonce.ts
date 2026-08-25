import { randomBytes } from 'node:crypto'

import { setResponseHeader } from 'h3'

/**
 * Content-Security-Policy with a per-request nonce.
 *
 * It lives here rather than in `routeRules` because a static header cannot
 * carry a nonce, which would force `script-src 'unsafe-inline'` and make the
 * script-src rule decorative. The `render:html` hook stamps the nonce onto
 * every `<script>` Nuxt emits.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const nonce = randomBytes(16).toString('base64url')

    const addNonce = (chunk: string) => chunk.replaceAll('<script', `<script nonce="${nonce}"`)
    html.head = html.head.map(addNonce)
    html.bodyPrepend = html.bodyPrepend.map(addNonce)
    html.body = html.body.map(addNonce)
    html.bodyAppend = html.bodyAppend.map(addNonce)

    setResponseHeader(
      event,
      'Content-Security-Policy',
      [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}'`,
        // @nuxt/image emits an inline onerror attribute on every <img>, and
        // inline handlers cannot carry a nonce. Allowing it needs
        // `script-src-attr 'unsafe-hashes' 'sha256-…'` with the hash of that
        // exact attribute, which silently breaks on the next @nuxt/image
        // release. Left out on purpose: the cost is a console warning and the
        // loss of @nuxt/image's broken-image marker, not a broken page.
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: https://api.b10cks.com",
        "media-src 'self' https://api.b10cks.com",
        "connect-src 'self' https://api.b10cks.com",
        "font-src 'self' data: https:",
        // Required for live preview: without it the b10cks editor cannot iframe
        // the site.
        'frame-ancestors https://app.b10cks.com',
      ].join('; ')
    )
  })
})
