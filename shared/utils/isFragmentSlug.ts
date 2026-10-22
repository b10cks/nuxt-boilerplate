/**
 * Entries at or below an underscore slug (`_config`, `_error`, `_drawers/…`)
 * are parts of other pages, not pages. They stay routable because the b10cks
 * live preview loads them by their own URL.
 */
export function isFragmentSlug(fullSlug: string): boolean {
  return fullSlug.split('/').some((segment) => segment.startsWith('_'))
}
