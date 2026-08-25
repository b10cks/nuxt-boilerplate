<script setup lang="ts">
import type { RichTextPlaceholderHandler } from '@b10cks/richtext'
import type { RichTextDocument, RichTextInternalLinkAttrs } from '@b10cks/vue/rich-text'
import { B10cksRichText } from '@b10cks/vue/rich-text'

/**
 * The one way to render b10cks rich text. It renders through
 * `<B10cksRichText>`, which builds real VNodes and sanitizes link and image
 * URLs against `allowedSchemes`, unlike `v-html` with `renderRichText`, which
 * puts unsanitized CMS HTML straight into the DOM.
 */
const props = defineProps<{
  document: RichTextDocument | null | undefined
  tag?: string
  /** Resolves `{token}` placeholders, e.g. from a config field. */
  placeholderHandler?: RichTextPlaceholderHandler
}>()

/** Turns a b10cks internal link into an app path. */
function resolveInternalLink(attrs: RichTextInternalLinkAttrs): string {
  // The editor has written the target under three different keys over time.
  const raw = attrs.url || attrs.cached_url || attrs.href || ''
  if (!raw) return '#'

  // Absolute, protocol and anchor-only links are already final.
  if (/^(https?:|mailto:|tel:|sms:|#)/i.test(raw) || raw.includes('//')) return raw

  const href = raw.startsWith('/') ? raw : `/${raw}`
  return attrs.anchor ? `${href}#${attrs.anchor}` : href
}
</script>

<template>
  <B10cksRichText
    :document="props.document"
    :tag="props.tag"
    :internal-link-handler="resolveInternalLink"
    :placeholder-handler="props.placeholderHandler"
  />
</template>
