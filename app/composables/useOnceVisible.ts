export function useOnceVisible(options?: IntersectionObserverInit) {
  const elRef = ref<HTMLElement | null>(null)
  const isVisible = ref(true) // SSR-safe: start visible to avoid flash on server render
  let observer: IntersectionObserver | null = null
  let cleanupTransition: (() => void) | null = null

  const setupObserver = (el: HTMLElement) => {
    if (el.getBoundingClientRect().top >= window.innerHeight) {
      isVisible.value = false
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          isVisible.value = true
          observer?.disconnect()
          observer = null
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px 0px 0px', ...options }
    )
    observer.observe(el)
  }

  onMounted(() => {
    const el = elRef.value
    if (!el) return

    // Defer setup until after page transitions so element positions are final.
    const transitionAncestor = el.closest('.page-enter-active')
    if (transitionAncestor) {
      const handler = () => setupObserver(el)
      transitionAncestor.addEventListener('transitionend', handler, { once: true })
      cleanupTransition = () => transitionAncestor.removeEventListener('transitionend', handler)
    } else {
      requestAnimationFrame(() => setupObserver(el))
    }
  })

  onUnmounted(() => {
    cleanupTransition?.()
    cleanupTransition = null
    observer?.disconnect()
    observer = null
  })

  return { elRef, isVisible }
}
