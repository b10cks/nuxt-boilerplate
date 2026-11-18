import type { B10cksAsset, B10cksConfig as GeneratedConfig, B10cksItem } from './generated'

export * from './generated'

/**
 * Optional `_config` fields the SEO composables read. Delete a field here once
 * the space defines it and `bun run types:b10cks` has generated it, and this
 * interface with the last one.
 */
export interface B10cksConfig extends GeneratedConfig {
  shareImage?: B10cksAsset | null
  logo?: B10cksAsset | null
  email?: string
  telephone?: string
  address?: string
  zip?: string
  city?: string
  country?: string
}

/**
 * The `drawer` block. Delete this once the block exists in your space and
 * `bun run types:b10cks` generates it.
 */
export interface B10cksDrawer extends B10cksItem {
  header?: string
  body?: B10cksItem[]
}
