/** Plain-text site summary for LLM crawlers, authored as the `_llms` content entry. */
export default defineEventHandler(async (event) => {
  const api = await createServerB10cksApi(event)

  let content = ''
  try {
    const entry = await api.getContent<{ content?: string }>('_llms')
    content = entry.content?.content || ''
  } catch {
    // The _llms entry does not exist in this space yet.
  }

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'max-age=180, s-maxage=86400, public')

  return content
})
