<script setup lang="ts">
/**
 * The app-wide drawer overlay, driven by `?drawer=<slug>`. `useB10cksLink` turns
 * every CMS link to `_drawers/<slug>` into that param.
 *
 * It runs in the browser only, so all `?drawer=` URLs of a page share one cached
 * HTML document and the param stays out of the CDN cache key.
 */
import type { IBContent } from '@b10cks/client'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  VisuallyHidden,
} from 'reka-ui'

import type { B10cksDrawer } from '~/b10cks/types'

const LABELS = {
  title: 'Details',
  close: 'Close',
  loading: 'Loading',
  error: 'This content could not be loaded.',
}

/** The value comes from the URL and ends up in an API path. */
const VALID_SLUG = /^[\w-]+(?:\/[\w-]+)*$/

const route = useRoute()
const version = useB10cksVersion()
const { dataApi } = useB10cksApi()

const slug = computed(() => {
  const value = route.query.drawer
  const first = Array.isArray(value) ? value[0] : value
  return first && VALID_SLUG.test(first) ? first : undefined
})

/**
 * Set when a link inside the drawer leaves the page. The route only updates once
 * the next page has loaded, and the drawer must not cover the page until then.
 */
const dismissed = ref(false)
watch(slug, () => {
  dismissed.value = false
})

function onLinkClick(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = (event.target as Element | null)?.closest('a[href]')
  if (!(link instanceof HTMLAnchorElement) || link.target === '_blank') return
  const url = new URL(link.href)
  if (url.origin === window.location.origin && !url.searchParams.has('drawer')) {
    dismissed.value = true
  }
}

function close() {
  const { drawer: _drawer, ...query } = route.query
  return navigateTo({ path: route.path, query, hash: route.hash })
}

const isOpen = computed({
  get: () => Boolean(slug.value) && !dismissed.value,
  set: (open) => {
    if (!open) close()
  },
})

const entry = shallowRef<IBContent<B10cksDrawer>>()
const status = ref<'loading' | 'error' | 'ready'>('loading')

watch(
  slug,
  async (current, _previous, onCleanup) => {
    // The last entry stays while the overlay animates out.
    if (!current) return

    let isStale = false
    onCleanup(() => {
      isStale = true
    })

    status.value = 'loading'
    try {
      const result = await dataApi.getContent<B10cksDrawer>(`_drawers/${current}`, {
        vid: version.value,
      })
      if (isStale) return
      entry.value = result
      status.value = 'ready'
    } catch {
      if (!isStale) status.value = 'error'
    }
  },
  { immediate: true }
)

const tree = usePreviewContent(() => toRootBlock(entry.value) ?? { id: '', block: '' })
const previewEntry = computed(() =>
  entry.value ? { ...entry.value, content: tree.value as B10cksDrawer } : undefined
)
const title = computed(() => previewEntry.value?.content.header || entry.value?.name)
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-60 bg-gray-950/60 backdrop-blur-sm motion-safe:duration-300 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0"
      />
      <DialogContent
        :aria-describedby="undefined"
        class="fixed inset-y-0 right-0 z-60 flex h-full w-full max-w-2xl flex-col overflow-y-auto overscroll-contain bg-card p-4 text-card-foreground shadow-xl outline-none motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:duration-200 motion-safe:data-[state=closed]:slide-out-to-right motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:duration-300 motion-safe:data-[state=open]:slide-in-from-right lg:p-8"
        @click.capture="onLinkClick"
      >
        <VisuallyHidden>
          <DialogTitle as="span">{{ title || LABELS.title }}</DialogTitle>
        </VisuallyHidden>

        <DialogClose
          class="absolute top-4 right-4 grid size-10 cursor-pointer place-items-center rounded-md hover:bg-accent lg:top-8 lg:right-8"
          :aria-label="LABELS.close"
        >
          <svg
            class="size-5"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <line
              x1="6"
              y1="6"
              x2="26"
              y2="26"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="26"
              y1="6"
              x2="6"
              y2="26"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </DialogClose>

        <p
          v-if="status === 'loading'"
          role="status"
          class="py-16 text-center"
        >
          {{ LABELS.loading }}
        </p>
        <p
          v-else-if="status === 'error'"
          role="alert"
          class="py-16 text-center"
        >
          {{ LABELS.error }}
        </p>
        <DrawerPanel
          v-else-if="previewEntry"
          :key="previewEntry.id"
          :entry="previewEntry"
        />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
