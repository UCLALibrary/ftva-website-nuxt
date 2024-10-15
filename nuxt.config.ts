// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  // when using local pnpm link with component library uncomment this line
  vite: {
    // ADDED FOLLOWING LINE TO RESOLVE CROSS-FETCH ERROR
    // Uncaught SyntaxError: The requested module '/_nuxt/node_modules/.pnpm/cross-fetch@3.1.8/node_modules/cross-fetch/dist/browser-ponyfill.js?v=4dc3293b'
    // does not provide an export named 'default' (at index.js?v=4dc3293b:6:8)
    // localhost/: 1
    resolve: {
      alias: {
        'cross-fetch': 'cross-fetch/dist/browser-ponyfill.js',
        '~ucla-library-design-tokens': 'ucla-library-design-tokens',
      },
    },
    server: {
      fs: {
        strict: false,
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
                        @import "ucla-library-design-tokens/scss/fonts.scss";
                        @import "ucla-library-design-tokens/scss/app.scss";
                    `,
        },
      },
    }
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      concurrency: 50,
      interval: 1000,
      // routes: ['/', '/404.html', '/200.html'],
    },
    hooks: {
      'prerender:generate'(route) {
        // TODO: fix issue with recursive fetches with query string, e.g.
        // `/enterprise/agencies?region=europe&amp;amp;amp;service=ecommerce&amp;amp;service=ecommerce&amp;service=content-marketing`
        /* if (route.route?.includes('&amp;')) {
          route.skip = true
        } */
        console.log('prerender:generate', route)
      },
      'prerender:routes'(routes) {
        // const allRoutes = []

        console.log('prerender:routes ctx.routes', routes)
      }
    },

  },

  runtimeConfig: {
    // Private keys are only available on the server
    esWriteKey: process.env.ES_WRITE_KEY,

    // Public keys that are exposed to the client
    public: {
      craftGraphqlURL: process.env.CRAFT_ENDPOINT || '',
      esReadKey: process.env.ES_READ_KEY || '',
      esAlias: process.env.ES_ALIAS || '',
      esIndexPrefix: process.env.ES_INDEX_PREFIX || '',
      esTempIndex: process.env.ES_INDEX_PREFIX + '-' + new Date().toISOString().toLowerCase().replaceAll(':', '-'),
      esURL: process.env.ES_URL || '',
      gtm: {
        id: 'GTM-T2SXV2'
      }
    },
  },

  /*
     ** Required charset and viewport meta tags
     */
  app: {
    /*
    ** Page transition
    */
    pageTransition: {
      name: 'fade',
      mode: 'out-in',
    },
    head: {
      titleTemplate: (titleChunk: string) => {
        // If undefined or blank then we don't need the pipe and space
        return titleChunk === 'Homepage' ? 'UCLA Film & Television Archive' : `${titleChunk || 'Error'}` + ' | UCLA Film & Television Archive'
      },
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1.0, minimum-scale=1.0',
        },
      ],
      link: [{ rel: 'icon', type: 'image/svg', href: '/icon-ucla-favicon.svg' }],
    },

    pageTransition: {
      name: 'fade',
      mode: 'out-in',
    },
  },

  /*
     ** Global CSS
     */
  css: [
    // 'ucla-library-design-tokens/scss/fonts.scss',
    'ucla-library-design-tokens/scss/app-global.scss',
    '~/assets/styles/global.scss',

    // use the following line when using pnpm link --global ucla-library-website-components-vue
    'ucla-library-website-components/dist/style.css',
  ],

  typescript: {
    strict: false
  },

  modules: [[
    '@pinia/nuxt',
    {
      autoImports: ['defineStore', 'acceptHMRUpdate'],
    },
  ], 'nuxt-graphql-request', '@nuxtjs/sitemap', '@zadigetvoltaire/nuxt-gtm'],

  build: {
    transpile: ['nuxt-graphql-request', 'ucla-library-website-components'],
  },

  site: {
    url: process.env.SITEMAP_HOST || 'https://www.library.ucla.edu',
  },

  imports: {
    dirs: ['stores'],
    transform: {
      // you could also add the path of your built library to prevent this happening
      // for your users, but the issue is probably only replicable in your monorepo
      exclude: [/\bsfui\b/]
    }
  },

  graphql: {
    /**
     * An Object of your GraphQL clients
     */
    clients: {
      default: {
        /**
         * The client endpoint url
         */
        endpoint: process.env.CRAFT_ENDPOINT || '',
        /**
         * Per-client options overrides
         * See: https://github.com/prisma-labs/graphql-request#passing-more-options-to-fetch
         */
        options: {},
      },

    },

    /**
     * Options
     * See: https://github.com/prisma-labs/graphql-request#passing-more-options-to-fetch
     */
    options: {
      method: 'get', // Default to `POST`
    },

    /**
     * Optional
     * default: false (this includes cross-fetch/polyfill before creating the graphql client)
     */
    // useFetchPolyfill: true,

    /**
     * Optional
     * default: false (this includes graphql-tag for node_modules folder)
     */
    // includeNodeModules: true,
  },

  /* experimental: {
    payloadExtraction: true,
    sharedPrerenderData: true
  } */
})
