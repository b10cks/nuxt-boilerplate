<script setup lang="ts">
import type { B10cksAsset } from '~/b10cks/types'
import type { IlumCropMode, IlumGravity } from '~/utils/providers/ilum'

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
}

const props = defineProps<B10cksImgProps>()

const loaded = ref(false)

// Intrinsic dimensions reserve the right box before the image arrives, so the
// layout does not shift. The dominant color fills that box in the meantime, and
// is dropped on load so transparent images do not keep the tint.
const placeholderStyle = computed(() =>
  !loaded.value && props.metadata?.dominant_color
    ? { backgroundColor: props.metadata.dominant_color }
    : undefined
)
</script>

<template>
  <NuxtImg
    :src="full_path"
    :alt="alt ?? (data?.alt as string | undefined) ?? ''"
    :width="width ?? metadata?.width"
    :height="height ?? metadata?.height"
    :style="placeholderStyle"
    :modifiers="{
      crop: crop || 'fill',
      gravity: gravity || (data?.focus as IlumGravity | undefined),
    }"
    @load="loaded = true"
  />
</template>
