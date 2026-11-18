import type { IBContent } from '@b10cks/client'
import { buildLocalizedPath } from '@b10cks/client'

type TranslatableContent = Pick<IBContent, 'resolved_language_iso' | 'full_slug' | 'translations'>

/** Site path per language an entry really exists in. */
export type PageAlternates = Record<string, string>

/**
 * Languages an entry is genuinely available in, each with its own path.
 *
 * b10cks answers a request for an untranslated language with fallback content
 * (`i18n_mode: overlay`) and echoes the *requested* `language_iso`, so only
 * `resolved_language_iso` names the language really served: the default
 * language on a fallback, the entry's own language on an entry that exists in
 * one non-default language only.
 */
export function contentAlternates(
  content: TranslatableContent | null | undefined,
  defaultLanguage: string
): PageAlternates {
  if (!content) {
    return {}
  }

  const served = content.resolved_language_iso ?? defaultLanguage
  // On a draft fallback this is the draft's slug; the default-language sibling
  // below replaces it with the real path.
  const alternates: PageAlternates = { [served]: buildLocalizedPath(content.full_slug, served) }

  for (const translation of content.translations ?? []) {
    if (translation.published_at) {
      alternates[translation.language_iso] = buildLocalizedPath(
        translation.full_slug,
        translation.language_iso
      )
    }
  }

  return alternates
}

/**
 * Wires a page entry's real translations into everything that names a
 * language: the switcher map (`usePageTranslations().translations`), the
 * hreflang links with x-default, `<html lang>` and the WebPage `inLanguage`.
 * Call once, from the page that fetched the entry, with the language it
 * requested.
 *
 * Returns whether that language is a real translation. When it is not, the
 * page serves another language's content under this URL and must be noindex.
 */
export function usePageAlternates(
  content: MaybeRefOrGetter<TranslatableContent | null | undefined>,
  language: MaybeRefOrGetter<string>
) {
  const { defaultLanguage } = useRuntimeConfig().public
  const site = useSiteConfig()
  const requestOrigin = useRequestURL().origin
  const route = useRoute()
  const { translations, setTranslations } = usePageTranslations()

  const alternates = computed(() => contentAlternates(toValue(content), defaultLanguage))
  const isTranslated = computed(() => Object.hasOwn(alternates.value, toValue(language)))
  const servedLanguage = computed(() => toValue(content)?.resolved_language_iso ?? defaultLanguage)

  watchEffect(() => setTranslations(alternates.value))
  onScopeDispose(() => {
    // Only clear our own map: during a route transition the next page may
    // already have published its own. `useState` hands back a proxy.
    if (translations.value && toRaw(translations.value) === alternates.value) {
      setTranslations(null)
    }
  })

  // Complete and reciprocal: every real translation, this page included, and
  // never a fallback. A single-language page gets none, and so does a page
  // whose own URL is not in the set: the paths assume i18n `strategy: 'prefix'`
  // (like the sitemap), so with i18n off they would point at missing routes.
  const links = computed(() => {
    const entries = Object.entries(alternates.value)
    const xDefault = alternates.value[defaultLanguage]
    const isSelfReferencing = entries.some(([, path]) => path === route.path)
    if (entries.length < 2 || !xDefault || !isSelfReferencing) {
      return []
    }

    const origin = site.url || requestOrigin
    return [
      ...entries.map(([hreflang, path]) => ({
        rel: 'alternate' as const,
        hreflang,
        href: siteUrl(origin, path),
      })),
      { rel: 'alternate' as const, hreflang: 'x-default', href: siteUrl(origin, xDefault) },
    ]
  })

  useHead({ htmlAttrs: { lang: servedLanguage }, link: links })
  // Merges into the page's WebPage node (same @id).
  useSchemaOrg([computed(() => defineWebPage({ inLanguage: servedLanguage.value }))])

  return { alternates, isTranslated }
}
