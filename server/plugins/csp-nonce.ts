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

    // Before the nonce pass: it adds an inline script of its own.
    deferScriptPreloads(html)

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
        // @nuxt/image renders onerror="this.setAttribute('data-error', 1)" on
        // every <img>. Inline handlers cannot carry a nonce, so that one
        // handler is allowed by its hash and every other one stays blocked.
        // If an @nuxt/image release changes the attribute, the browser logs a
        // CSP violation per image again: recompute the hash with
        // printf "%s" "<handler>" | openssl dgst -sha256 -binary | base64
        "script-src-attr 'unsafe-hashes' 'sha256-bwK6T5wZVTANitXbrTsel7kl/PyCjCd/Dq5Qoz3imjM='",
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
