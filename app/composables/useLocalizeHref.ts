/**
 * Returns a function that turns a stored link into the URL it should point at
 * on this page: canonical, and with the locale of the current route. An
 * unprefixed link would cost a 301 that picks the language from the visitor's
 * cookie or browser, and send a crawler on `/en/…` to another language.
 *
 * The locale comes from the path because `strategy: 'prefix'` puts it there, so
 * this works with `@nuxtjs/i18n` absent. Call the result during render.
 */
export function useLocalizeHref() {
  const route = useRoute()
  const settings = localeSettings(useRuntimeConfig().public)

  return (href: string) => localizeHref(href, settings.codes, pathLocale(route.path, settings))
}
