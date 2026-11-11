/**
 * Runs in the browser, at the end of the body. Starts the script preloads once
 * the page's opening image (`loading="eager"` on `B10cksImg`) has arrived, or
 * right away on a page without one.
 */
const START_PRELOADS = `(function(hrefs){function start(){hrefs.forEach(function(href){var link=document.createElement('link');link.rel='modulepreload';link.fetchPriority='low';link.crossOrigin='';link.href=href;document.head.appendChild(link)})}var image=document.querySelector('img[fetchpriority="high"]');if(!image||image.complete)start();else{image.addEventListener('load',start,{once:true});image.addEventListener('error',start,{once:true})}})`

/**
 * A page preloads every script chunk it uses, on a grown site some 85 of
 * them. As `modulepreload` links in the head they are fetched together with
 * the page's opening image and, on a phone, take most of the connection from
 * it. So the links leave the head and an inline script adds them back when
 * that image has loaded, at low priority. Hydration starts no later: the entry
 * script stays where it is, and the chunks are still fetched in parallel
 * instead of one import after the other.
 *
 * Adds an inline script, so it has to run before the CSP nonce pass
 * (`server/plugins/csp-nonce.ts`).
 */
export function deferScriptPreloads(html: { head: string[]; bodyAppend: string[] }): void {
  const hrefs: string[] = []
  html.head = html.head.map((chunk) =>
    chunk.replace(/<link rel="modulepreload"[^>]*\bhref="([^"]+)"[^>]*>/g, (_, href: string) => {
      hrefs.push(href)
      return ''
    })
  )
  if (hrefs.length) {
    html.bodyAppend.push(`<script>${START_PRELOADS}(${JSON.stringify(hrefs)})</script>`)
  }
}
