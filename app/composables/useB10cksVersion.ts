/**
 * The content version to request from the API.
 *
 * The b10cks editor drives the preview through `?b10cks_vid=<version>`. Vue
 * Router types a query value as `string | string[] | null`, so it is narrowed
 * to the first entry here. Outside preview it resolves to `'published'`.
 */
export default function useB10cksVersion() {
  const route = useRoute()

  return computed(() => {
    const vid = route.query.b10cks_vid
    return (Array.isArray(vid) ? vid[0] : vid) || 'published'
  })
}
