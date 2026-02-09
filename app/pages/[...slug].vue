<script setup lang="ts">
const route = useRoute()
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : route.params.slug || 'home'

const { useContent } = useB10cksApi()
const { data: content, execute } = useContent(slug, {}, { immediate: false })
await execute()

provide('content', content)
</script>

<template>
  <div>
    <NuxtLayout>
      <B10cksComponent
        v-if="content"
        v-bind="{
          block: { id: content.id, block: content.block, ...content.content },
          name: content.name,
        }"
      />
    </NuxtLayout>
  </div>
</template>
