import type { RouteLocationRaw } from '#vue-router'

import type { B10cksLink } from '~/b10cks/types'

export default function useB10cksLink() {
  return (
    link: B10cksLink | undefined
  ):
    | {
        to: string | RouteLocationRaw
        target?: string
      }
    | undefined => {
    if (!link) {
      return
    }

    const { type, url, email, anchor, target = '_self' } = link

    let to = url
    if (type === 'email') {
      return {
        to: `mailto:${email}`,
        target,
      }
    }

    if (anchor) {
      to = `${to.trim()}#${anchor}`
    }

    return {
      to,
      target,
    }
  }
}
