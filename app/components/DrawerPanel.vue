<script setup lang="ts">
/**
 * The inside of a drawer: headline and body blocks. Shared by the overlay
 * (`DrawerHost.vue`) and the routable preview page (`app/b10cks/Drawer.vue`), so
 * an editor previews what a visitor gets.
 *
 * Body blocks never get `isFirst`: the headline is the drawer's heading, and the
 * page behind the overlay already has its h1.
 */
import type { IBContent } from '@b10cks/client'

import type { B10cksDrawer } from '~/b10cks/types'

const props = defineProps<{
  entry: IBContent<B10cksDrawer>
  /** True on the drawer's own route, where the headline is the page's h1. */
  isPage?: boolean
}>()

provide(
  'content',
  computed(() => props.entry)
)

const headline = computed(() => props.entry.content.header || props.entry.name)
</script>

<template>
  <div class="flex flex-col gap-8">
    <h1
      v-if="isPage"
      class="text-3xl font-medium text-card-foreground"
    >
      {{ headline }}
    </h1>
    <h2
      v-else
      class="pr-12 text-3xl font-medium text-card-foreground"
    >
      {{ headline }}
    </h2>

    <B10cksComponent
      v-for="block in entry.content.body"
      :key="block.id"
      :block="block"
    />
  </div>
</template>
