import type { IBContent } from '@b10cks/client'

/**
 * Flattens a content entry into the block shape `<B10cksComponent>` renders:
 * the entry's id and block type, with the content tree spread on top.
 *
 * Pass `tree` to render a live preview tree (see `usePreviewContent`) instead
 * of the fetched `content.content`.
 */
export function toBlock<T extends Record<string, unknown>>(
  content: IBContent<T> | undefined | null,
  tree?: T
): ({ id: string; block: string } & T) | undefined {
  if (!content) {
    return undefined
  }

  return { id: content.id, block: content.block, ...(tree ?? content.content) }
}
