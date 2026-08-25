<script setup lang="ts">
await provideB10cksConfig()
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <slot />
    <AppFooter class="mt-auto" />
  </div>
</template>
