<script setup lang="ts">
import type { NuxtError } from '#app'
import type { B10cksError } from '~/b10cks/types'

const props = defineProps<{ error: NuxtError }>()

/**
 * Copy for a 5xx, and for a 4xx when b10cks cannot deliver `_error`. That is
 * most likely exactly when this page renders: an outage takes the content and
 * the translations down together, so these strings cannot come from `$t()`.
 */
const FALLBACK = {
  notFound: {
    title: "Sorry, this page doesn't exist.",
    text: 'The link may be out of date or the address may have changed.',
  },
  server: {
    title: 'Something went wrong.',
    text: "The page couldn't be loaded just now. Please try again in a moment.",
  },
  home: 'Go to home page',
  retry: 'Try again',
} as const

const route = useRoute()

const status = computed(() => props.error.status ?? props.error.statusCode ?? 500)
const isClientError = computed(() => status.value >= 400 && status.value < 500)
const copy = computed(() => FALLBACK[isClientError.value ? 'notFound' : 'server'])

// A 4xx renders the editors' `_error` entry. A 5xx does not ask b10cks again:
// it is probably the reason for the error.
const { useContent } = useB10cksApi()
const { data: content } = await useContent<B10cksError>(
  '_error',
  {},
  { immediate: isClientError.value }
)
const body = computed(() => (isClientError.value && content.value?.content.body) || [])

// The status code stays, but an error page never belongs in an index.
useSeoMeta({
  title: () => `${status.value}`,
  robots: 'noindex, nofollow',
})

// Details are for developers only. Production never shows message or stack:
// a failed API request carries its URL, access token included.
const details = import.meta.dev ? [props.error.message, props.error.stack].filter(Boolean) : []

// A client-side navigation keeps focus on the link that failed: move it to the
// message.
const main = useTemplateRef('main')
onMounted(() => main.value?.focus({ preventScroll: true }))
</script>

<template>
  <NuxtLayout>
    <main
      ref="main"
      tabindex="-1"
      class="content-grid mb-24 space-y-24 pt-24 outline-none"
    >
      <B10cksComponent
        v-for="(b, i) in body"
        :key="b.id"
        :block="b"
        :is-first="i === 0"
      />
      <section
        v-if="!body.length"
        class="max-w-3xl"
      >
        <p class="text-muted-foreground">{{ status }}</p>
        <h1 class="mt-4 text-3xl font-medium text-balance">{{ copy.title }}</h1>
        <p class="mt-4 text-pretty text-muted-foreground">{{ copy.text }}</p>
        <div class="mt-8 flex flex-wrap gap-6">
          <a
            href="/"
            class="underline underline-offset-4"
          >
            {{ FALLBACK.home }}
          </a>
          <a
            v-if="!isClientError"
            :href="route.fullPath"
            class="underline underline-offset-4"
          >
            {{ FALLBACK.retry }}
          </a>
        </div>
      </section>
      <pre
        v-if="details.length"
        class="overflow-x-auto rounded-lg bg-muted p-4 text-xs text-muted-foreground"
        >{{ details.join('\n\n') }}</pre>
    </main>
  </NuxtLayout>
</template>
