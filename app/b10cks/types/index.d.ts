import type { B10cksAsset, B10cksConfig as GeneratedConfig } from './generated'

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
