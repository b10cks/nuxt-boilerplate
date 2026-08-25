import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'

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
    '*': {
      headers: {
        // Content-Security-Policy is set in server/plugins/csp-nonce.ts, which
        // can carry a per-request nonce.
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=()',
        'X-Robots-Tag':
          (process.env.NUXT_PUBLIC_APP_ENV || 'production') === 'staging'
            ? 'noindex, nofollow, noarchive'
            : 'all',
      },
    },
    '/': {
      headers:
        (process.env.NUXT_PUBLIC_APP_ENV || 'production') === 'production'
          ? { 'Cache-Control': 'max-age=180, s-maxage=86400, public' }
          : {},
    },
    '/**': {
      headers:
        (process.env.NUXT_PUBLIC_APP_ENV || 'production') === 'production'
          ? { 'Cache-Control': 'max-age=180, s-maxage=86400, public' }
          : {},
    },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: {
        lang: 'en',
        dir: 'ltr',
      },
      link: [
        {
          rel: 'preconnect',
          href: 'https://api.b10cks.com',
          crossorigin: '',
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

  site: {
    name: '',
    url: process.env.NUXT_PUBLIC_APP_URL,
  },

  schemaOrg: {},

  css: ['~/assets/css/main.css'],

  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
  },

  vite: {
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
