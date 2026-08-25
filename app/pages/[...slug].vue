<script setup lang="ts">
const route = useRoute()
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : route.params.slug || 'home'

const version = useB10cksVersion()

const { useContent } = useB10cksApi()
const { data: content, error } = await useContent(slug, { vid: version.value })

if (error.value) {
  throw error.value
}

if (!content.value) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true })
}

// Live-updates while editing in the b10cks editor; outside preview mode it
// simply tracks the fetched content tree.
const tree = usePreviewContent(() => content.value?.content ?? {})
const block = computed(() => toBlock(content.value, tree.value))

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
