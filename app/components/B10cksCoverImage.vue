<script setup lang="ts">
import type { B10cksAsset } from '~/b10cks/types'
import type { IlumGravity } from '~/utils/providers/ilum'

/**
 * A CMS image that fills a full-screen box:
 * `<B10cksCoverImage :image="block.image" :portrait="block.portrait" class="size-full object-cover" />`.
 *
 * A portrait viewport shows only the middle of a landscape file, so it gets its
 * own source: the `portrait` asset, or a 9:16 crop of `image` around its focus.
 * The browser downloads only the source it shows. Classes land on the `<img>`.
 *
 * `eager` marks the image the page opens with, see `B10cksImg`.
 */
const props = withDefaults(
  defineProps<{
    image: B10cksAsset
    portrait?: B10cksAsset | null
    /** Overrides the assets' own alt text. */
    alt?: string
    loading?: 'lazy' | 'eager'
  }>(),
  { portrait: undefined, alt: undefined, loading: 'lazy' }
)
defineOptions({ inheritAttrs: false })

const PORTRAIT = '(orientation: portrait)'
const LANDSCAPE = '(orientation: landscape)'
const SIZES = 'xs:100vw sm:100vw md:100vw lg:100vw xl:100vw 2xl:100vw'
const PORTRAIT_CROP = { width: 1080, height: 1920 }

const portraitAsset = computed(() => (props.portrait?.full_path ? props.portrait : props.image))
const portraitFrame = computed(() => {
  const { width, height } = props.portrait?.metadata ?? {}
  return width && height ? { width, height } : PORTRAIT_CROP
})

const modifiers = computed(() => ({
  crop: 'fill' as const,
  gravity: props.image.data?.focus as IlumGravity | undefined,
}))
const width = computed(() => props.image.metadata?.width)
const height = computed(() => props.image.metadata?.height)

const candidates = useImageCandidates()
const portraitCandidates = computed(() =>
  candidates(portraitAsset.value.full_path, {
    sizes: SIZES,
    modifiers: {
      crop: 'fill',
      gravity: portraitAsset.value.data?.focus as IlumGravity | undefined,
      ...portraitFrame.value,
    },
  })
)

if (import.meta.server && props.loading === 'eager') {
  usePreloadImage(portraitCandidates.value, PORTRAIT)
  usePreloadImage(
    candidates(props.image.full_path, {
      sizes: SIZES,
      modifiers: { ...modifiers.value, width: width.value, height: height.value },
    }),
    LANDSCAPE
  )
}

const altText = computed(() => {
  const own = props.image.data?.alt || portraitAsset.value.data?.alt
  return props.alt ?? (typeof own === 'string' ? own : '')
})

const loaded = ref(false)

// One `<img>` serves both sources, so what differs per orientation is passed as
// custom properties and picked by the `portrait:` classes in the template.
const coverStyle = computed(() => ({
  '--cover-focus': focusPosition(props.image.data?.focus),
  '--cover-focus-portrait': focusPosition(portraitAsset.value.data?.focus),
  '--cover-color': props.image.metadata?.dominant_color,
  '--cover-color-portrait': portraitAsset.value.metadata?.dominant_color,
}))
</script>

<template>
  <picture>
    <source
      :media="PORTRAIT"
      :srcset="portraitCandidates.srcset"
      :sizes="portraitCandidates.sizes"
      :width="portraitFrame.width"
      :height="portraitFrame.height"
    />
    <NuxtImg
      v-bind="$attrs"
      :src="image.full_path"
      :alt="altText"
      :width="width"
      :height="height"
      :sizes="SIZES"
      :modifiers="modifiers"
      :loading="loading"
      :fetchpriority="loading === 'eager' ? 'high' : undefined"
      :style="coverStyle"
      class="object-(--cover-focus) portrait:object-(--cover-focus-portrait)"
      :class="!loaded && 'bg-(color:--cover-color) portrait:bg-(color:--cover-color-portrait)'"
      @load="loaded = true"
    />
  </picture>
</template>
