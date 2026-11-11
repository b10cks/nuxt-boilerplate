import type { B10cksConfig } from '~/b10cks/types'

/**
 * Fetches the space's `_config` entry. Call it once, from the layout, and hand
 * the result to `provide(siteConfigKey, ...)` there.
 *
 * The `provide` deliberately stays in the layout: `<script setup>` restores the
 * component instance after its own awaits, but not after an await hidden inside
 * a helper. A `provide()` behind that await runs with no current instance and
 * is silently dropped.
 *
 * Fetching the config per component looks harmless but is not: `useB10cksConfig`
 * keys its `useAsyncData` off its params, so two callers passing different
 * params race and the loser silently gets the other's language.
 *
 * `GetConfigOptions` accepts both `language` and `language_iso`; `language_iso`
 * wins in the SDK and matches `useContent`, so only that one is exposed here.
 *
 * The version comes from `useB10cksVersion()` rather than a caller argument.
 * Without it the config request defaults to `vid=published` while the page it
 * decorates is fetched at `vid=draft`, so an editor previewing a space whose
 * `_config` has never been published gets an empty header and footer.
 */
export async function fetchB10cksConfig(params?: { language_iso?: string }) {
  const { useB10cksConfig } = useB10cksApi()
  const version = useB10cksVersion()
  const { config } = await useB10cksConfig<B10cksConfig>({ ...params, vid: version.value })

  return config
}

/** The config provided by the layout. */
export function useB10cksSiteConfig() {
  const config = inject(siteConfigKey)
  if (!config) {
    throw new Error('useB10cksSiteConfig() requires a layout that provides siteConfigKey')
  }

  return config
}
