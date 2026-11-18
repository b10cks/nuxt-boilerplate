/**
 * Moves between the prefixed paths the router serves under i18n
 * `strategy: 'prefix'` and the unprefixed paths b10cks stores.
 *
 * `codes` is empty while i18n is off, which turns these helpers into plain path
 * normalisation.
 */
export interface LocaleSettings {
  codes: string[]
  defaultLocale?: string
}

/**
 * The i18n module's locales, read from the public runtime config so that nothing
 * here depends on the module being installed.
 */
export function localeSettings(publicConfig: object): LocaleSettings {
  const i18n = 'i18n' in publicConfig ? publicConfig.i18n : undefined
  if (!i18n || typeof i18n !== 'object' || !('locales' in i18n) || !Array.isArray(i18n.locales)) {
    return { codes: [] }
  }

  const codes = i18n.locales.flatMap((locale: unknown) => {
    if (typeof locale === 'string') {
      return [locale]
    }
    if (locale && typeof locale === 'object' && 'code' in locale) {
      return typeof locale.code === 'string' ? [locale.code] : []
    }
    return []
  })
  const defaultLocale =
    'defaultLocale' in i18n && typeof i18n.defaultLocale === 'string' && i18n.defaultLocale

  return { codes, defaultLocale: defaultLocale || undefined }
}

/** Splits a leading locale segment off a rooted path. */
export function splitLocale(
  path: string,
  locales: readonly string[]
): { locale?: string; path: string } {
  const segment = path.split('/')[1] ?? ''
  if (!locales.includes(segment)) {
    return { path }
  }

  return { locale: segment, path: path.slice(segment.length + 1) || '/' }
}

/**
 * Applies `internalHref` and puts the locale on an internal page link. A link
 * that already names a locale keeps it. External URLs, files, API paths and a
 * bare `?query` or `#hash` get no prefix.
 */
export function localizeHref(href: string, locales: readonly string[], locale?: string): string {
  const canonical = internalHref(href)
  if (!locale || !canonical.startsWith('/') || canonical.startsWith('//')) {
    return canonical
  }

  return canonical.replace(/^[^?#]+/, (path) => {
    if (!isPagePath(path)) {
      return path
    }
    const { locale: own = locale, path: rest } = splitLocale(path, locales)
    const target = internalPath(rest)
    return target === '/' ? `/${own}` : `/${own}${target}`
  })
}

/**
 * The locale a path belongs to. A path without one, like an old URL or the 404
 * page behind it, gets the default locale, so that the links on it do not depend
 * on the visitor's browser language.
 */
export function pathLocale(path: string, { codes, defaultLocale }: LocaleSettings) {
  return splitLocale(path, codes).locale ?? defaultLocale
}

/**
 * The redirect for a request path. b10cks stores sources with and without a
 * locale, so the full path is tried first, then the path without its locale. The
 * target gets the request's locale unless it names one itself. A target that
 * resolves to the requested path is no redirect: `/old` to `/de/old` would
 * otherwise loop on `/de/old`.
 */
export function findRedirect<R extends { target: string }>(
  redirects: Record<string, R>,
  path: string,
  settings: LocaleSettings
): R | undefined {
  const stored = splitLocale(path, settings.codes).path
  const redirect = redirects[path] ?? redirects[stored]
  const locale = pathLocale(path, settings)
  if (!redirect || !locale) {
    return redirect
  }

  const target = localizeHref(redirect.target, settings.codes, locale)
  return target.replace(/[?#].*$/, '') === path ? undefined : { ...redirect, target }
}
