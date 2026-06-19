<script setup lang="ts">
const route = useRoute()
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : route.params.slug || 'home'

const { useContent } = useB10cksApi()
const { data: content, error } = await useContent(slug, {
  vid:
    (Array.isArray(route.query.b10cks_vid) ? route.query.b10cks_vid[0] : route.query.b10cks_vid) ||
    'published',
})

if (error.value) {
  throw error.value
}

provide('content', content)
</script>

<template>
  <div>
    <NuxtLayout>
      <B10cksComponent
        v-if="content"
        v-bind="{
          block: { id: content.id, block: content.block, ...content.content },
          content: content,
        }"
      />
    </NuxtLayout>
  </div>
</template>
