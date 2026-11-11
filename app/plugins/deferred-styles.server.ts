/**
 * With `features.inlineStyles` the server HTML carries all the CSS it needs.
 * Nuxt still links the stylesheet of every chunk the page loads, for
 * components that only render later in the browser (a drawer that is closed,
 * say). In the head such a file blocks the first paint for a round trip, so it
 * goes to the end of the body, where it blocks nothing above it.
 */
export default defineNuxtPlugin(() => {
  injectHead().hooks?.hook('tags:resolve', ({ tags }) => {
    for (const tag of tags) {
      if (
        tag.tag === 'link' &&
        tag.props.rel === 'stylesheet' &&
        String(tag.props.href).includes('/_nuxt/')
      ) {
        tag.tagPosition = 'bodyClose'
      }
    }
  })
})
