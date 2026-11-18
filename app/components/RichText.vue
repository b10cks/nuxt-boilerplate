<script setup lang="ts">
import type { RichTextPlaceholderHandler } from '@b10cks/richtext'
import type {
  EditableRichTextField,
  RichTextDocument,
  RichTextInternalLinkAttrs,
} from '@b10cks/vue/rich-text'
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
  /** The source field, e.g. `{ id: block.id, path: ['body'] }`, to edit it in place in the live preview. */
  editable?: EditableRichTextField
}>()

const localize = useLocalizeHref()

/** Turns a b10cks internal link into an app path. The renderer appends `attrs.anchor`. */
function resolveInternalLink(attrs: RichTextInternalLinkAttrs): string {
  // The editor has written the target under three different keys over time.
  const raw = attrs.url || attrs.cached_url || attrs.href || ''
  return raw ? localize(raw) : '#'
}
</script>

<template>
  <B10cksRichText
    :document="props.document"
    :tag="props.tag"
    :internal-link-handler="resolveInternalLink"
    :placeholder-handler="props.placeholderHandler"
    :editable="props.editable"
  />
</template>
