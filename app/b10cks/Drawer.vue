<script setup lang="ts">
/**
 * A drawer on its own route. Visitors see drawers in the overlay
 * (`DrawerHost.vue`), but the b10cks live preview loads `_drawers/<slug>` as a
 * page, so this mirrors the overlay's panel.
 */
import type { IBContent } from '@b10cks/client'

import type { B10cksDrawer } from './types'

const props = defineProps<{ block: B10cksDrawer; content: IBContent }>()

useB10cksSeo(
  () => undefined,
  () => props.block.header || props.content.name
)

// Live preview pushes edits into `block`, not into `content`.
const entry = computed(() => ({ ...props.content, content: props.block }))
</script>

<template>
  <main
    v-editable="block"
    class="flex min-h-[60vh] justify-end bg-background p-4 lg:p-8"
  >
    <div class="w-full max-w-2xl bg-card p-4 text-card-foreground shadow-xl lg:p-8">
      <DrawerPanel
        :entry="entry"
        is-page
      />
    </div>
  </main>
</template>
