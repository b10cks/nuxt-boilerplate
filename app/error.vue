<script setup lang="ts">
import type { NuxtError } from '#app'

import type { B10cksError } from '~/b10cks/types'

const { useContent } = useB10cksApi()
const props = defineProps({
  error: Object as () => NuxtError,
})
const { data: content } = await useContent<B10cksError>('_error', {
  rv: String(Date.now()),
})
</script>

<template>
  <NuxtLayout>
    <main class="content-grid mb-24 space-y-24 pt-24">
      <B10cksComponent
        v-for="(b, i) in content?.content.body || []"
        :key="b.id"
        :block="b"
        :is-first="i === 0"
      />
      <div class="text-destructive">{{ error?.status }} {{ error?.message }}</div>
    </main>
  </NuxtLayout>
</template>
