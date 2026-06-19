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
    accessToken: process.env.NUXT_B10CKS_ACCESS_TOKEN || process.env.NUXT_B10CKS_API_TOKEN || '',
    apiUrl: process.env.NUXT_B10CKS_API_URL || 'https://api.b10cks.com/api',
    componentsDir: '~/b10cks',
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
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https://api.b10cks.com; connect-src 'self' https://api.b10cks.com; font-src 'self' data: https:; frame-ancestors https://app.b10cks.com/;",
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
  },
  telemetry: {
    enabled: false,
  },
  experimental: {
    payloadExtraction: true,
  },
  compressPublicAssets: true,
})
