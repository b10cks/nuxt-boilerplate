import type { UseSeoMetaInput } from '@unhead/vue/types'

import type { B10cksMeta } from '~/b10cks/types'

export function b10cksMetaToSeo(meta: B10cksMeta | undefined): UseSeoMetaInput {
  if (!meta) return {}

  const { ogImage, ...rest } = meta

  return {
    ...rest,
    ogImage: ogImage?.url,
  }
}
