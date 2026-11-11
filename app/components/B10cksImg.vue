<script setup lang="ts">
import type { IlumCropMode, IlumGravity } from '~/utils/providers/ilum'

// Relative on purpose: the Vue compiler cannot resolve `~/` for a props type
// (see `vite.vue.script.fs` in nuxt.config.ts).
import type { B10cksAsset } from '../b10cks/types'

/**
 * Props extend `B10cksAsset`, so an asset field binds straight through:
 * `<B10cksImg v-bind="block.image" sizes="xs:100vw md:50vw" />`.
 */
interface B10cksImgProps extends B10cksAsset {
  /**
   * Overrides the asset's own alt text. Falls back to `''` rather than to
   * nothing: an `<img>` with no alt attribute at all makes screen readers
   * announce the file URL.
   */
  alt?: string
  crop?: IlumCropMode
  gravity?: IlumGravity
  width?: number | string
  height?: number | string
  /**
   * Responsive sizes, as on `NuxtImg`. Keys are `xs`, `sm`, `md`, `lg`, `xl`
   * and `2xl`; an unknown key is skipped without a warning.
   */
  sizes?: string
  /**
   * `eager` marks the image the page opens with: the first image of the first
   * block, in practice the page's largest paint. It is fetched at high
   * priority and preloaded from the top of the head. Everything else is
   * `lazy`, the default.
   */
  loading?: 'lazy' | 'eager'
}

const props = withDefaults(defineProps<B10cksImgProps>(), { loading: 'lazy' })

const loaded = ref(false)

const imgWidth = computed(() => Number(props.width ?? props.metadata?.width) || undefined)
const imgHeight = computed(() => Number(props.height ?? props.metadata?.height) || undefined)
const modifiers = computed(() => ({
  crop: props.crop || 'fill',
  gravity: props.gravity || (props.data?.focus as IlumGravity | undefined),
}))

// The link has to name the same candidates as the `<img>` that `NuxtImg`
// renders below, or the browser downloads the image twice. `NuxtImg`'s own
// `preload` leaves the srcset out and would fetch the largest file.
if (import.meta.server && props.loading === 'eager') {
  const img = useImage()
  const { src, srcset, sizes } = img.getSizes(props.full_path, {
    sizes: props.sizes,
    modifiers: {
      ...modifiers.value,
      width: imgWidth.value,
      height: imgHeight.value,
      quality: img.options.quality,
    },
  })
  useHead({
    link: [
      {
        rel: 'preload',
        as: 'image',
        href: src,
        imagesrcset: srcset,
        imagesizes: sizes,
        fetchpriority: 'high',
        // Ahead of the inlined styles, behind the preconnect.
        tagPriority: 25,
      },
    ],
  })
}

// The focus drives the crop gravity in the URL. The same point steers CSS
// `object-cover`, which re-crops whenever the box differs from the requested
// ratio. Without a point the browser default (centre) stays.
const objectPosition = computed(() => {
  const point = typeof props.gravity === 'object' ? props.gravity : props.data?.focus
  if (!point || typeof point !== 'object' || !('x' in point) || !('y' in point)) return undefined
  return typeof point.x === 'number' && typeof point.y === 'number'
    ? `${point.x}% ${point.y}%`
    : undefined
})

// Intrinsic dimensions reserve the right box before the image arrives, so the
// layout does not shift. The dominant color fills that box in the meantime, and
// is dropped on load so transparent images do not keep the tint.
const imgStyle = computed(() => ({
  objectPosition: objectPosition.value,
  backgroundColor: loaded.value ? undefined : props.metadata?.dominant_color,
}))
</script>

<template>
  <NuxtImg
    :src="full_path"
    :alt="alt ?? (data?.alt as string | undefined) ?? ''"
    :width="imgWidth"
    :height="imgHeight"
    :sizes="sizes"
    :loading="loading"
    :fetchpriority="loading === 'eager' ? 'high' : undefined"
    :style="imgStyle"
    :modifiers="modifiers"
    @load="loaded = true"
  />
</template>
