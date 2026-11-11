<script setup lang="ts">
const route = useRoute()
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : route.params.slug || 'home'

const version = useB10cksVersion()

const { useContent } = useB10cksApi()
const { data: content, error } = await useContent(slug, { vid: version.value })

/**
 * Every error thrown from here is `fatal` in the browser: on a client-side
 * navigation a non-fatal one is swallowed and the visitor is left with a blank
 * page under the new URL.
 *
 * A 404 on a client-side navigation is loaded from the server instead, because
 * only the server knows the CMS redirects (server/middleware/redirects.ts): the
 * visitor gets the redirect if there is one, else the error page with a real
 * 404 status.
 *
 * On the server `fatal` changes nothing about the response, it only makes
 * nitro log the error with its stack trace. A 4xx is an expected answer
 * (scanner probes, stale links), so only a 5xx is logged.
 */
async function fail(error: { statusCode: number; statusMessage: string }): Promise<never> {
  if (import.meta.client && error.statusCode === 404 && !useNuxtApp().isHydrating) {
    window.location.replace(route.fullPath)
    // Holds the navigation until the browser has left the page.
    await new Promise(() => {})
  }
  throw createError({ ...error, fatal: import.meta.client || error.statusCode >= 500 })
}

if (error.value) {
  const { statusCode = 500, statusMessage = error.value.message } = isNuxtError(error.value)
    ? error.value
    : {}
  await fail({ statusCode, statusMessage })
}

if (!content.value) {
  await fail({ statusCode: 404, statusMessage: 'Not Found' })
}

// Live-updates while editing in the b10cks editor; outside preview mode it
// simply tracks the fetched content tree.
const tree = usePreviewContent(() => content.value?.content ?? {})
const block = computed(() => toBlock(content.value, tree.value))

provide('content', content)

// The language this route asks for. Single-language while i18n is off; when
// you turn it on, use the active locale here and pass it to useContent as
// `language_iso`.
const language = useRuntimeConfig().public.defaultLanguage
const { isTranslated } = usePageAlternates(content, language)

// A fragment rendered as a page is thin content. It gets noindex rather than a
// 404 (the preview needs the route) or a robots.txt Disallow (a crawler that
// may not fetch the URL never sees the noindex and can still index it bare).
// An untranslated fallback is default-language content under another
// language's URL: reachable, but kept out of the index (and the sitemap).
// The high priority wins over the editor's robots value from the page block.
const isFragment = isFragmentSlug(slug)
useSeoMeta(
  {
    robots: () =>
      isFragment ? 'noindex, nofollow' : isTranslated.value ? undefined : 'noindex, follow',
  },
  { tagPriority: 'high' }
)
</script>

<template>
  <div>
    <NuxtLayout>
      <B10cksComponent
        v-if="content && block"
        :block="block"
        :content="content"
      />
    </NuxtLayout>
  </div>
</template>
