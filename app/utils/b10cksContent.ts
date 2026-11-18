import type { B10cksAsset } from '~/b10cks/types'

/**
 * An entry without its `body` blocks, for the `transform` of a listing. A card
 * never renders them, and they are most of an entry's weight in the payload.
 */
export function withoutBody<Entry extends { content: { body?: unknown } }>(entry: Entry): Entry {
  return { ...entry, content: { ...entry.content, body: undefined } }
}

/**
 * An asset without the metadata a card never reads (palette, EXIF, thumbnails),
 * for the `transform` of a listing. Keeps everything `B10cksImg` reads.
 */
export function toCardImage(asset: B10cksAsset): B10cksAsset {
  const { data, metadata } = asset
  return {
    ...asset,
    data: { alt: data?.alt, focus: data?.focus },
    metadata: {
      width: metadata?.width,
      height: metadata?.height,
      dominant_color: metadata?.dominant_color,
    },
  }
}

/** Reads the mime type: `metadata.type` is empty on uploads b10cks did not classify. */
export function isVideo(asset: { mime_type?: string } | null | undefined): boolean {
  return asset?.mime_type?.startsWith('video/') ?? false
}

interface TreeEntry {
  position: number
  // The delivery API sends a position per translation, the client types omit it.
  translations: readonly { language_iso: string; position?: number }[]
}

/**
 * Entries in CMS tree order. A translated row keeps a position of its own that
 * does not follow a reorder in the tree, so the default language's row decides.
 */
export function inTreeOrder<Entry extends TreeEntry>(
  entries: readonly Entry[],
  defaultLanguage: string
): Entry[] {
  const treePosition = ({ position, translations }: TreeEntry) =>
    translations.find(({ language_iso }) => language_iso === defaultLanguage)?.position ?? position
  return [...entries].sort((a, b) => treePosition(a) - treePosition(b))
}
