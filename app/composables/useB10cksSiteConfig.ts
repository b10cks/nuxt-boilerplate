import type { B10cksConfig } from '~/b10cks/types'

/**
 * Fetches the space's `_config` entry and hands it to the component tree. Call
 * it once, from the layout.
 *
 * Fetching it per component looks harmless but is not: `useB10cksConfig` keys
 * its `useAsyncData` off its params, so two callers passing different params
 * race and the loser silently gets the other's language.
 *
 * `GetConfigOptions` accepts both `language` and `language_iso`; `language_iso`
 * wins in the SDK and matches `useContent`, so only that one is exposed here.
 */
export async function provideB10cksConfig(params?: { language_iso?: string }) {
  const { useB10cksConfig } = useB10cksApi()
  const { config } = await useB10cksConfig<B10cksConfig>(params)

  provide(siteConfigKey, config)

  return config
}

/** The config provided by the layout. */
export function useB10cksSiteConfig() {
  const config = inject(siteConfigKey)
  if (!config) {
    throw new Error('useB10cksSiteConfig() requires a layout that calls provideB10cksConfig()')
  }

  return config
}
