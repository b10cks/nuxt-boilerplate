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

    // Internal drawer links — open as a query param overlay
    const drawerPattern = '_drawers/'
    if (to.includes(drawerPattern)) {
      return {
        to: {
          query: {
            drawer: to.split(drawerPattern).pop(),
          },
        },
      }
    }

    const whitelistedParams = ['b10cks_rv']
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
