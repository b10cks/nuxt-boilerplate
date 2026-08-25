import type { IBDataEntry } from '@b10cks/client'
import { ApiClient, createB10cksDataApi } from '@b10cks/client'

import { useRuntimeConfig } from '#imports'

/**
 * vue-i18n messages for one locale, from the b10cks `translations` datasource.
 *
 * Wire it up in the `i18n` block of nuxt.config.ts, e.g.
 * `locales: [{ code: 'en', language: 'en-US', name: 'English', file: 'en.ts' }]`
 * with `i18n/locales/en.ts` doing
 * `export default defineI18nLocale(() => fetchLocale('en'))`.
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

export async function fetchLocale(locale: string): Promise<Record<string, unknown>> {
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

    return unflatten(entries)
  } catch (error) {
    // A dictionary outage must degrade to raw keys, not to a 500.
    console.error(`[i18n] failed to load '${locale}' translations from b10cks`, error)
    return {}
  }
}
