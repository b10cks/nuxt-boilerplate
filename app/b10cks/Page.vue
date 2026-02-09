<script setup lang="ts">
import type { B10cksPage } from './types'

const props = defineProps<{ block: B10cksPage }>()

defineOptions({
  inheritAttrs: false,
})

useSeoMeta({
  title: props.block.meta?.title || props.name,
  ...props.block.meta,
})

if (import.meta.server) {
  watch(props.block, ({ meta }) => {
    useSeoMeta(meta)
  })
}
</script>

<template>
  <main
    v-editable="block"
    class="content-grid mb-24 space-y-24 xl:mb-48 xl:space-y-48 [&>:first-child:not(.content-full-width)]:mt-48"
  >
    <B10cksComponent
      v-for="(b, i) in block.body"
      :key="b.id"
      :block="b"
      :is-first="i === 0"
    />
  </main>
</template>
