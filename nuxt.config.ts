import { readFileSync, realpathSync, statSync } from 'node:fs'

import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'

const isStaging = (process.env.NUXT_PUBLIC_APP_ENV || 'production') === 'staging'
const isProduction = (process.env.NUXT_PUBLIC_APP_ENV || 'production') === 'production'

const RESPONSE_HEADERS = {
  // Content-Security-Policy is set in server/plugins/csp-nonce.ts, which can
  // carry a per-request nonce.
  //
  // No includeSubDomains or preload by default: either forces HTTPS on every
  // other host under the domain, and preload cannot be taken back quickly. Add
  // them once you know every subdomain serves HTTPS.
  'Strict-Transport-Security': 'max-age=63072000',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=()',
  // Staging stays out of every index, whatever an editor sets on a page. In
  // production the page's own robots meta tag decides.
  'X-Robots-Tag': isStaging ? 'noindex, nofollow, noarchive' : 'all',
  // A CDN keeps a page fresh for an hour, then serves the cached copy for up
  // to a day while it fetches a new one in the background, and keeps serving
  // it if the origin fails.
  ...(isProduction && {
    'Cache-Control':
      'max-age=180, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400, public',
  }),
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: false },

  modules: [
    '@b10cks/nuxt',
    // '@nuxtjs/i18n',
    '@nuxt/icon',
    '@nuxt/image',
    'nuxt-schema-org',
  ],

  b10cks: {
    // accessToken and apiUrl come from the environment: Nuxt maps
    // NUXT_PUBLIC_B10CKS_ACCESS_TOKEN and NUXT_PUBLIC_B10CKS_API_URL onto
    // runtimeConfig.public.b10cks at runtime, so they stay out of this file.
    componentsDir: '~/b10cks',
    // Keep block selection visible below the sticky header while editing.
    // Can also be tuned in CSS via `--b10cks-scroll-offset`.
    scrollOffset: 80,
    // Only the b10cks editor may drive the preview bridge (matches the CSP
    // frame-ancestors below).
    allowedOrigins: ['https://app.b10cks.com'],
  },

  runtimeConfig: {
    public: {
      appEnv: process.env.NUXT_PUBLIC_APP_ENV || 'production',
      siteUrl: process.env.NUXT_PUBLIC_APP_URL || '',
      // The space's default content language. Every entry exists in it, and an
      // untranslated page falls back to it (see usePageAlternates).
      defaultLanguage: process.env.NUXT_PUBLIC_DEFAULT_LANGUAGE || 'en',
    },
  },

  icon: {
    provider: 'server',
    customCollections: [
      {
        prefix: 'custom',
        dir: './app/assets/icons',
      },
    ],
  },

  // Uncomment to enable i18n. Messages come from the b10cks `translations`
  // datasource: have each `i18n/locales/<code>.ts` do
  // `export default defineI18nLocale(() => fetchLocale('<code>'))`
  // with `fetchLocale` from `i18n/fetchLocale.ts`. Also uncomment
  // '@nuxtjs/i18n' in `modules` and add it as a dependency.
  /*
    i18n: {
      baseUrl: process.env.NUXT_PUBLIC_APP_URL || '',
      defaultLocale: 'en',
      strategy: 'prefix',
      detectBrowserLanguage: {
        useCookie: false,
        redirectOn: 'root',
      },
      locales: [
        { file: 'en.ts', code: 'en', language: 'en-US', name: 'English' },
      ],
    },
  */

  image: {
    provider: 'ilum',
    // @nuxt/image 2 dropped the `xs` screen and skips a `sizes` key it does not
    // know, without a warning: `xs:100vw lg:50vw` then renders as `50vw` and a
    // phone gets the half-width file. This puts it back.
    screens: { xs: 320 },
    providers: {
      ilum: {
        name: 'ilum',
        provider: '~/utils/providers/ilum',
        options: {
          baseURL: process.env.NUXT_ILUM_BASE_URL,
        },
      },
    },
  },

  routeRules: {
    // Every response, pages and API alike. Both keys are needed: `/**` does
    // not match the root, and `*` matches one path segment only, which leaves
    // every page below the first level without these headers. A route that
    // answers per visitor needs its own rule with `Cache-Control: no-store`.
    '/': { headers: RESPONSE_HEADERS },
    '/**': { headers: RESPONSE_HEADERS },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: {
        lang: process.env.NUXT_PUBLIC_DEFAULT_LANGUAGE || 'en',
        dir: 'ltr',
      },
      link: [
        // The image CDN. No `crossorigin`: images are fetched without CORS, and
        // a CORS preconnect opens a connection they cannot use.
        {
          rel: 'preconnect',
          href: 'https://api.b10cks.com',
        },
        // {
        //   rel: 'apple-touch-icon',
        //   sizes: '180x180',
        //   href: '/apple-touch-icon.png',
        // },
        // {
        //   rel: 'icon',
        //   type: 'image/x-icon',
        //   sizes: '32x32',
        //   href: '/favicon.ico',
        // },
        // {
        //   rel: 'icon',
        //   type: 'image/png',
        //   sizes: '96x96',
        //   href: '/favicon-96x96.png',
        // },
        // {
        //   rel: 'icon',
        //   type: 'image/svg+xml',
        //   href: '/favicon.svg',
        // },
        {
          rel: 'manifest',
          href: '/site.webmanifest',
        },
      ],
    },
  },

  // url resolves per request (server/plugins/site-config.ts), not at build time.
  site: {
    name: '',
  },

  schemaOrg: {},

  css: ['~/assets/css/main.css'],

  features: {
    // All CSS goes into the HTML. The default inlines component styles only
    // and links main.css from the head, where it blocks the first paint for a
    // round trip. See app/plugins/deferred-styles.server.ts for the rest.
    inlineStyles: true,
  },

  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
  },

  vite: {
    vue: {
      script: {
        // `defineProps<Props>()` with `Props` extending an imported type makes
        // the Vue compiler read that type's file. It takes its file access
        // from the TypeScript JS API, which TypeScript 7 no longer ships, so
        // it gets one here. Module resolution is still missing: import such a
        // type by relative path, not through `~/` (see B10cksImg.vue).
        fs: {
          fileExists: (file) => statSync(file, { throwIfNoEntry: false })?.isFile() ?? false,
          readFile: (file) => readFileSync(file, 'utf8'),
          realpath: realpathSync,
        },
      },
    },
    plugins: [
      svgLoader({
        svgoConfig: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  inlineStyles: {
                    onlyMatchedOnce: false,
                  },
                  removeViewBox: false,
                  convertShapeToPath: false,
                  mergePaths: false,
                },
              },
            },
            {
              name: 'removeAttrs',
              params: {
                attrs: 'data-name',
              },
            },
            {
              name: 'convertStyleToAttrs',
            },
          ],
        },
      }),
      tailwindcss(),
    ],
  },

  nitro: {
    prerender: {
      failOnError: false,
    },
    compressPublicAssets: true,
  },
  telemetry: {
    enabled: false,
  },
  experimental: {
    payloadExtraction: true,
    // ssrStreaming is deliberately off. On Nuxt 4.5 with @b10cks/nuxt it ships
    // the HTML shell with an empty __NUXT_DATA__ payload, so the client has
    // nothing to hydrate against and every page renders blank after hydration.
    // Nuxt 4.5: forward a prefetched route's preload hints (e.g. hero images
    // via useHead/NuxtImg) as prefetch hints — pairs with payloadExtraction.
    prefetchPreloadTags: true,
    // Nuxt 4.5: reuse Vite's file watcher instead of running a second one
    // (less memory/file handles; becomes the default in v5).
    watcher: 'builder',
  },
})
