<script setup lang="ts">
import type { IBContent } from '@b10cks/client'

import type { B10cksPage } from './types'

const props = defineProps<{ block: B10cksPage; content: IBContent }>()
defineOptions({
  inheritAttrs: false,
})

useB10cksSeo(
  () => props.block.meta,
  () => props.content.name
)
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
