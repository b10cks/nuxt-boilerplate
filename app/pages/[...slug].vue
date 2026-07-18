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

// Live-updates while editing in the b10cks editor; outside preview mode it
// simply tracks the fetched content tree.
const tree = usePreviewContent(() => content.value?.content ?? {})
const block = computed(() =>
  content.value ? { id: content.value.id, block: content.value.block, ...tree.value } : undefined
)

provide('content', content)
</script>

<template>
  <div>
    <NuxtLayout>
      <B10cksComponent
        v-if="content && block"
        :block="block"
        :content="content"
      />
    </NuxtLayout>
  </div>
</template>
