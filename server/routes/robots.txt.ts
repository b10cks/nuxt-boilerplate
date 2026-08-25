/**
 * Served from a route rather than `public/robots.txt` so staging can lock
 * crawlers out and the sitemap URL follows the deployment instead of being
 * hardcoded to one domain.
 */
export default defineEventHandler((event) => {
  const isStaging = (useRuntimeConfig(event).public.appEnv || 'production') === 'staging'
  const siteUrl = resolveSiteUrl(event)

  const lines = isStaging
    ? ['User-agent: *', 'Disallow: /']
    : [
        'User-agent: *',
        'Content-Signal: ai-train=no, search=yes, ai-input=yes',
        'Allow: /',
        '',
        '# Explicitly allow AI crawlers',
        ...[
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'Google-Extended',
          'ClaudeBot',
          'anthropic-ai',
          'PerplexityBot',
          'Applebot-Extended',
        ].flatMap((agent) => [`User-agent: ${agent}`, 'Allow: /', '']),
        `Sitemap: ${siteUrl}/sitemap.xml`,
      ]

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'max-age=180, s-maxage=86400, public')

  return lines.join('\n')
})
