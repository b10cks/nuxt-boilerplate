import type { B10cksDataApi } from '@b10cks/client'
import { ApiClient, createB10cksDataApi } from '@b10cks/client'
import type { H3Event } from 'h3'

/**
 * A data API for nitro routes, pinned to published content.
 *
 * Credentials come from `useRuntimeConfig`, not `process.env`: only
 * runtimeConfig picks up the `NUXT_PUBLIC_*` overrides applied at boot, so
 * reading the environment directly serves the build-time values instead.
 */
export async function createServerB10cksApi(event?: H3Event): Promise<B10cksDataApi> {
  const { b10cks } = useRuntimeConfig(event).public

  const api = createB10cksDataApi(
    new ApiClient({
      baseUrl: b10cks?.apiUrl || 'https://api.b10cks.com/api',
      token: b10cks?.accessToken || '',
      version: 'published',
    })
  )

  // Required, do not remove. A fresh client has no revision, so the delivery
  // CDN answers from whatever it cached under a stale `rv` and the route serves
  // content that was already replaced. syncRevision pulls the space's current
  // revision and pins every request this client makes to it.
  await api.syncRevision()

  return api
}

/** The absolute origin every URL in a sitemap or robots.txt response must use. */
export function resolveSiteUrl(event: H3Event): string {
  const configured = useRuntimeConfig(event).public.siteUrl
  if (configured) {
    return configured.replace(/\/+$/, '')
  }

  return getRequestURL(event).origin
}
