import type { RouteLocationRaw } from '#vue-router'
import type { B10cksLink } from '~/b10cks/types'

const PREVIEW_PARAMS = ['b10cks_rv', 'b10cks_vid']

export default function useB10cksLink() {
  const route = useRoute()
  const localize = useLocalizeHref()

  // The server renders no visitor's query into a link: the HTML is shared at the
  // CDN. Read the result in a computed or the template, so it updates on mount.
  const isMounted = ref(false)
  onMounted(() => {
    isMounted.value = true
  })
  const pageQuery = () =>
    isMounted.value
      ? route.query
      : Object.fromEntries(
          PREVIEW_PARAMS.filter((param) => param in route.query).map((param) => [
            param,
            route.query[param],
          ])
        )

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
      return link.email ? { to: `mailto:${link.email}` } : undefined
    }

    const target = ('target' in link && link.target) || '_self'
    const url = ('url' in link && link.url?.trim()) || ''
    const anchor = 'anchor' in link && link.anchor ? `#${link.anchor}` : ''

    // An editor can leave an empty link object behind.
    if (!url && !anchor) {
      return
    }

    // Drawer links never navigate: they only set `?drawer=<slug>` on the current
    // location. The existing query is spread so preview params (b10cks_vid,
    // b10cks_rv) survive; `drawer` is overwritten, so a drawer-to-drawer link
    // swaps instead of stacking.
    const drawerPattern = '_drawers/'
    if (url.includes(drawerPattern)) {
      return {
        to: {
          path: route.path,
          query: {
            ...pageQuery(),
            drawer: url.split(drawerPattern).pop(),
          },
        },
      }
    }

    const [, path = '', search = '', hash = ''] =
      localize(url).match(/^([^?#]*)(?:\?([^#]*))?(#.*)?$/) ?? []
    const fragment = anchor || hash
    const ownParams = new URLSearchParams(search)
    const searchParams = new URLSearchParams(params ?? ('params' in link ? link.params : undefined))

    // Every link carries the preview params, so the editor keeps showing the
    // previewed revision and version instead of falling back to published. A jump
    // within the current page keeps the whole query in the browser, except
    // `drawer`: a jump from inside an open drawer closes it.
    const isSamePageJump = fragment && (!path || path === internalPath(route.path))
    const inheritedParams = isSamePageJump
      ? Object.keys(pageQuery()).filter((param) => param !== 'drawer')
      : PREVIEW_PARAMS

    for (const param of inheritedParams) {
      if (ownParams.has(param) || searchParams.has(param)) continue
      for (const value of [route.query[param]].flat()) {
        if (value) searchParams.append(param, value)
      }
    }

    const query = [search, searchParams.toString()].filter(Boolean).join('&')

    return {
      to: `${path || route.path}${query && `?${query}`}${fragment}`,
      target,
    }
  }
}
