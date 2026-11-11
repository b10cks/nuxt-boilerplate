<script setup lang="ts">
provide(siteConfigKey, await fetchB10cksConfig())
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <slot />
    <AppFooter class="mt-auto" />
  </div>
</template>
