<script setup lang="ts">
const route = useRoute()
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : route.params.slug || 'home'

const { useContent } = useB10cksApi()
const { data: content } = await useContent(slug, {
  vid: route.query.b10cks_vid || 'published',
})

provide('content', content)
</script>

<template>
  <div>
    <NuxtLayout>
      <B10cksComponent
        v-if="content"
        v-bind="{
          block: { id: content.id, ...content.content },
          content: content,
        }"
      />
    </NuxtLayout>
  </div>
</template>
