import type { RouterConfig } from 'nuxt/schema'

/**
 * Scroll position that puts the element a route hash names just below the
 * sticky header, or undefined when there is no visible element to jump to.
 *
 * Measured from the layout (`offsetTop`), not the viewport: a reveal animation
 * or page transition still shifting the target would otherwise end the jump
 * where the element is now instead of where it settles.
 */
function hashScrollTop(hash: string): number | undefined {
  const el = document.getElementById(hash.slice(1))
  if (!(el instanceof HTMLElement) || !el.getClientRects().length) {
    return undefined
  }

  let top = 0
  for (let node: Element | null = el; node instanceof HTMLElement; node = node.offsetParent) {
    top += node.offsetTop + (node.offsetParent?.clientTop ?? 0)
  }

  const scrollMargin = Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0
  const scrollPadding =
    Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0

  return top - scrollMargin - scrollPadding
}

/**
 * Nuxt's default scroll behavior with one change: hash targets are positioned
 * by `hashScrollTop`. Nuxt does not call this for the first page load. There the
 * browser jumps to the hash itself and honors `scroll-padding-top` from main.css.
 */
export default {
  scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp()
    const router = useRouter()
    // Set through `router.options` in nuxt.config.ts, missing from the router's type.
    const isSmooth =
      'scrollBehaviorType' in router.options && router.options.scrollBehaviorType === 'smooth'
    const behavior: ScrollBehavior = isSmooth ? 'smooth' : 'auto'

    const hashPosition = () => {
      const top = to.hash ? hashScrollTop(to.hash) : undefined
      return top === undefined ? undefined : { top, behavior }
    }

    if (to.path.replace(/\/$/, '') === from.path.replace(/\/$/, '')) {
      if (to.hash) return hashPosition() ?? false
      return from.hash ? (savedPosition ?? { left: 0, top: 0 }) : false
    }

    const scrollToTop =
      typeof to.meta.scrollToTop === 'function'
        ? to.meta.scrollToTop(to, from)
        : to.meta.scrollToTop
    if (scrollToTop === false) return false

    // The target exists once the new page is loaded and the old one has left.
    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce('page:loading:end', async () => {
        await nuxtApp['~transitionPromise']
        requestAnimationFrame(() => {
          if (router.currentRoute.value.fullPath !== to.fullPath) {
            resolve(false)
            return
          }
          resolve(savedPosition ?? hashPosition() ?? { left: 0, top: 0 })
        })
      })
    })
  },
} satisfies RouterConfig
