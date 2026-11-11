import type { IBDataEntry } from '@b10cks/client'
import { ApiClient, createB10cksDataApi } from '@b10cks/client'

import { useRuntimeConfig } from '#imports'

/**
 * vue-i18n messages for one locale, from the b10cks `translations` datasource.
 *
 * Wire it up in the `i18n` block of nuxt.config.ts, e.g.
 * `locales: [{ code: 'en', language: 'en-US', name: 'English', file: 'en.ts' }]`
 * with `i18n/locales/en.ts` doing
 * `export default async () => fetchLocale('en')`. Keep that a plain arrow
 * function: wrapped in `defineI18nLocale` the default export is a call
 * expression, which the i18n resource plugin under Vite 8 rejects.
 *
 * The base locale's strings are the stored `value`; every other locale is a
 * dimension on top of it, so b10cks falls back to the base for keys a locale
 * has not translated yet.
 */
const SOURCE = 'translations'
const BASE_LOCALE = 'en'

/**
 * Fetched in one page on purpose. The datasource entries endpoint mis-offsets
 * page 2 and up: it re-serves the tail of page 1 and never returns the real
 * remainder, so paging silently drops keys. Keep this above the entry count.
 */
const PER_PAGE = 1000

/** Keeps a dictionary across renders without outliving an edit in b10cks for long. */
const CACHE_TTL_MS = 5 * 60 * 1000

const cache = new Map<string, { at: number; messages: Record<string, unknown> }>()

/** A vue-i18n linked reference: `@:key` or a modified `@.lower:key`. */
const LINKED_REF = /^(?::|\.[a-z]+:)/i

/**
 * Escapes a bare `@` so editors can write plain prose.
 *
 * `@` opens a linked message in vue-i18n's syntax, so one email address in one
 * entry throws "Invalid linked format" at compile time and takes down every
 * page rendering that key. Real linked references are left intact.
 */
function escapeLinkedSyntax(value: string): string {
  return value.replace(/@/g, (_match, offset: number, full: string) =>
    LINKED_REF.test(full.slice(offset + 1)) ? '@' : "{'@'}"
  )
}

/** Expands flat, dotted keys ("nav.menu.open") into the tree vue-i18n resolves. */
function unflatten(entries: IBDataEntry[]): Record<string, unknown> {
  const root: Record<string, unknown> = {}

  for (const { key, value } of entries) {
    const parts = key.split('.')
    const leaf = parts.pop()
    if (!leaf) continue

    let node = root
    for (const part of parts) {
      if (typeof node[part] !== 'object' || node[part] === null) {
        node[part] = {}
      }
      node = node[part] as Record<string, unknown>
    }
    node[leaf] = escapeLinkedSyntax(value)
  }

  return root
}

/**
 * Cached per server instance for five minutes. Without it every page render
 * fetches the whole dictionary, and a crawl burst sends one API request per
 * page.
 */
export async function fetchLocale(locale: string): Promise<Record<string, unknown>> {
  const cached = cache.get(locale)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.messages
  }

  const { b10cks } = useRuntimeConfig().public

  try {
    const api = createB10cksDataApi(
      new ApiClient({
        baseUrl: b10cks?.apiUrl || 'https://api.b10cks.com/api',
        token: b10cks?.accessToken || '',
        version: 'published',
      })
    )

    const entries = await api.getDataEntries(SOURCE, {
      per_page: PER_PAGE,
      // `dimension` selects the locale's overrides. The base locale has none:
      // its strings are the stored `value`.
      ...(locale === BASE_LOCALE ? {} : { dimension: locale }),
    })

    const messages = unflatten(entries)
    cache.set(locale, { at: Date.now(), messages })
    return messages
  } catch (error) {
    // A dictionary outage must degrade to the last known strings, or to raw
    // keys, not to a 500.
    console.error(`[i18n] failed to load '${locale}' translations from b10cks`, error)
    return cached?.messages ?? {}
  }
}
