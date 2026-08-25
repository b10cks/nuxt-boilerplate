import type { RouteLocationRaw } from '#vue-router'
import type { B10cksLink } from '~/b10cks/types'

export default function useB10cksLink() {
  const route = useRoute()

  return (
    link: B10cksLink | undefined,
    params?: string
  ):
    | {
        to: string | RouteLocationRaw
        target?: string
      }
    | undefined => {
    if (!link) {
      return
    }

    if (link.type === 'email') {
      return {
        to: `mailto:${link.email}`,
      }
    }

    const target = ('target' in link && link.target) || '_self'
    let to = ('url' in link && link.url) || ''

    // Drawer links never navigate: they only set `?drawer=<slug>` on the current
    // location. The existing query is spread so preview params (b10cks_vid,
    // b10cks_rv) survive; `drawer` is overwritten, so a drawer-to-drawer link
    // swaps instead of stacking.
    const drawerPattern = '_drawers/'
    if (to.includes(drawerPattern)) {
      return {
        to: {
          path: route.path,
          query: {
            ...route.query,
            drawer: to.split(drawerPattern).pop(),
          },
        },
      }
    }

    // Carried across in-preview navigation so the editor keeps showing the
    // previewed revision and version instead of falling back to published.
    const whitelistedParams = ['b10cks_rv', 'b10cks_vid']
    const searchParams = new URLSearchParams(params ?? ('params' in link ? link.params : undefined))

    whitelistedParams.forEach((param) => {
      const value = route.query[param] as string | undefined
      if (value) {
        searchParams.append(param, value)
      }
    })

    const queryString = searchParams.toString()
    if (queryString) {
      to = `${to}${to.includes('?') ? '&' : '?'}${queryString}`
    }

    if ('anchor' in link && link.anchor) {
      to = `${to.trim()}#${link.anchor}`
    }

    return {
      to,
      target,
    }
  }
}
