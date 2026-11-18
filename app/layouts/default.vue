<script setup lang="ts">
const config = await fetchB10cksConfig()
provide(siteConfigKey, config)
useSiteSchema(config)

// The wrapper's `overflow-x-clip` is a safety net against sideways scrolling on
// phones. Unlike `hidden` it creates no scroll container, so sticky elements
// keep working. It only hides the symptom: fix the element that is too wide.
</script>

<template>
  <div class="flex min-h-screen flex-col overflow-x-clip">
    <AppHeader />
    <slot />
    <AppFooter class="mt-auto" />
  </div>
</template>
