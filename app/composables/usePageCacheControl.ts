import type { IBContent } from '@b10cks/client'

const BROWSER_MAX_AGE = 180
const STALE_WINDOW = 60
const STALE_IF_ERROR = 86400

/**
 * `Cache-Control` of a page with its own lifetime. An editor who sets one asks
 * for a hard limit, so the CDN serves a stale copy for a minute at most instead
 * of the default day. The last good copy still covers an origin failure.
 */
export function pageCacheControl(ttl: number): string {
  const maxAge = Math.min(BROWSER_MAX_AGE, ttl)
  const stale = Math.min(STALE_WINDOW, ttl)
  return `max-age=${maxAge}, s-maxage=${ttl}, stale-while-revalidate=${stale}, stale-if-error=${STALE_IF_ERROR}, public`
}

/**
 * Applies the cache TTL an editor set on an entry in b10cks to this response,
 * replacing the default from the route rules (nuxt.config.ts). An entry without
 * one keeps the default. Previews and non-production environments, which have
 * no public cache header to replace, are left alone. Call it once the entry is
 * known to render, so an error page keeps its `no-store`.
 */
export function usePageCacheControl(content: Pick<IBContent, 'cache'> | null | undefined) {
  if (import.meta.client) {
    return
  }

  const ttl = content?.cache?.ttl
  const isPublic = useRuntimeConfig().public.appEnv === 'production'
  if (typeof ttl === 'number' && ttl >= 0 && isPublic && useB10cksVersion().value === 'published') {
    useResponseHeader('cache-control').value = pageCacheControl(ttl)
  }
}
