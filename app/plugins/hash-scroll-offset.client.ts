/**
 * Keeps hash targets clear of the sticky header.
 *
 * Nuxt's default scroll behavior reads `scroll-margin-top` through
 * `querySelector(hash)`, which throws for ids starting with a digit. Block
 * anchors are ULIDs, so the offset silently falls back to 0. This wraps the
 * default behavior and resolves the offset with `getElementById` instead.
 */
export default defineNuxtPlugin(() => {
  const router = useRouter()
  const scrollBehavior = router.options.scrollBehavior
  if (!scrollBehavior) return

  router.options.scrollBehavior = async (to, from, savedPosition) => {
    const position = await scrollBehavior(to, from, savedPosition)
    if (!position || !('el' in position) || typeof position.el !== 'string') return position
    if (!position.el.startsWith('#')) return position

    const el = document.getElementById(decodeURIComponent(position.el.slice(1)))
    if (!el) return position

    const scrollMarginTop = Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    const scrollPaddingTop =
      Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0

    return { ...position, el, top: scrollMarginTop + scrollPaddingTop }
  }
})
