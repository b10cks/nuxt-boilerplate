<script setup lang="ts">
import { marked } from 'marked'

const props = defineProps<{ content: string }>()

const html = computed(() => {
  return marked.parse(props.content as string)
})

function onClick(e: MouseEvent) {
  if (!((e.target as HTMLElement).tagName === 'A')) {
    return
  }

  const url = new URL((e.target as HTMLLinkElement).href, useRequestURL())
  if (url.protocol === 'mailto:') {
    return
  }

  e.preventDefault()
  if (url.host !== location.host) {
    window.open(url, '_blank')
    return
  }

  navigateTo(url.pathname)
}
</script>

<template>
  <div
    class="prose"
    @click.capture="onClick"
    v-html="html"
  />
</template>
