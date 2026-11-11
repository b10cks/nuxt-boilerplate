<script setup lang="ts">
import { useEventListener, useIntersectionObserver, usePreferredReducedMotion } from '@vueuse/core'

// Relative on purpose: the Vue compiler cannot resolve `~/` for a props type
// (see `vite.vue.script.fs` in nuxt.config.ts).
import type { B10cksAsset } from '../b10cks/types'

/**
 * A muted, looping video that plays by itself, for a video asset field:
 * `<B10cksVideo v-bind="block.video" />`.
 *
 * The server renders it without a source. A `<video autoplay>` with one starts
 * downloading with the page, several MB that compete with the first paint even
 * when the video sits below the first screen. So the source is attached once
 * the page has loaded and the video is within half a viewport, and playback
 * starts then. Under reduced motion it stays paused; pass `controls` when the
 * visitor should be able to start it.
 *
 * It renders no poster. Put a `<B10cksImg>` behind it instead (see CLAUDE.md,
 * "Page performance"), which gets a srcset and the opening-image treatment.
 */
defineProps<B10cksAsset>()

const video = useTemplateRef('video')
const reducedMotion = usePreferredReducedMotion()

const pageLoaded = ref(false)
const inRange = ref(false)
const isNear = computed(() => pageLoaded.value && inRange.value)

onMounted(() => {
  pageLoaded.value = document.readyState === 'complete'
})
useEventListener('load', () => (pageLoaded.value = true), { once: true })

const { stop } = useIntersectionObserver(
  video,
  ([entry]) => {
    if (!entry?.isIntersecting) return
    inRange.value = true
    stop()
  },
  { rootMargin: '50% 0px' }
)

// Autoplay is not guaranteed (browser policies, low-power mode), so the
// rejection is swallowed and the image behind the video stays visible.
watch(
  isNear,
  (near) => {
    if (near && reducedMotion.value !== 'reduce') video.value?.play().catch(() => {})
  },
  { flush: 'post' }
)
</script>

<template>
  <video
    ref="video"
    :src="isNear ? url : undefined"
    :width="metadata?.width"
    :height="metadata?.height"
    :aria-label="(data?.alt as string | undefined) || undefined"
    preload="none"
    muted
    playsinline
    loop
  />
</template>
