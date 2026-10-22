import type { RedirectMap } from '@b10cks/client'

/**
 * Points every redirect at the end of its chain, so a visitor takes one hop
 * (`a → b → c` becomes `a → c`). Redirects that run into a cycle are dropped:
 * SSR follows a middleware redirect internally, and a loop would spin until the
 * worker runs out of memory.
 */
export function collapseRedirects(map: RedirectMap): RedirectMap {
  const collapsed: RedirectMap = {}

  for (const [source, redirect] of Object.entries(map)) {
    const seen = new Set([source])
    let target = redirect.target
    for (let next = map[target]; next && !seen.has(target); next = map[target]) {
      seen.add(target)
      target = next.target
    }
    if (!seen.has(target)) collapsed[source] = { ...redirect, target }
  }

  return collapsed
}
