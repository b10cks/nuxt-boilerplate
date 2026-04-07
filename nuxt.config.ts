import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@b10cks/nuxt',
    // '@nuxtjs/i18n',
    '@nuxt/icon',
    '@nuxt/image',
    'nuxt-schema-org',
  ],

  b10cks: {
    accessToken: process.env.NUXT_B10CKS_API_TOKEN || '',
    apiUrl: process.env.NUXT_B10CKS_API_URL || 'https://api.b10cks.com/api',
    componentsDir: '~/b10cks',
  },

  runtimeConfig: {
    public: {
      appEnv: process.env.NUXT_PUBLIC_APP_ENV,
    },
  },

  icon: {
    size: '1rem',
    mode: 'svg',
    serverBundle: {
      collections: [],
    },
    customCollections: [
      {
        prefix: 'b10cks',
        dir: './assets/icons',
      },
    ],
  },

  /*
    i18n: {
      defaultLocale: 'en',
      strategy: 'prefix',
      detectBrowserLanguage: {
        useCookie: false,
        redirectOn: 'root',
      },
      locales: [
        { code: 'de', language: 'de-AT', name: 'Deutsch' },
        { code: 'en', language: 'en-US', name: 'English' },
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
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: https://api.b10cks.com; media-src 'self' https://api.b10cks.com; connect-src 'self' https://api.b10cks.com; font-src 'self' data: https:; frame-ancestors https://app.b10cks.com/;",
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=()',
      },
    },
    '/': { headers: { 'Cache-Control': 'max-age=180, s-maxage=86400, public' } },
    '/**': { headers: { 'Cache-Control': 'max-age=180, s-maxage=86400, public' } },
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
        dir: 'ltr',
      },
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
    inlineDynamicImports: true,
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
