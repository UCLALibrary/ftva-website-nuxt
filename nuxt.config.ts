// https://nuxt.com/docs/api/configuration/nuxt-config
import svgLoader from 'vite-svg-loader'

export default defineNuxtConfig({
  // when using local pnpm link with component library uncomment this line
  vite: {
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
    },
    plugins: [svgLoader()],
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
    ssr: {
      noExternal: ['vuetify'], // Include Vuetify in the server-side bundle
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
                        @import "ucla-library-design-tokens/scss/_tokens-ftva";
                        @import "ucla-library-design-tokens/scss/app.scss";
                    `,
        },
      },
    }
  },

  nitro: {
    prerender: {
      crawlLinks: false,
      failOnError: false,
      concurrency: 50,
      interval: 1000,
      routes: ['/', '/events/', '/collections/', '/collections/motion-picture/', '/collections/television/', '/collections/watch-listen-online/', '/collections/la-rebellion/filmmakers/', '/collections/la-rebellion/filmography/', '/collections/in-the-life/episodes/', '/series/', '/blog/', '/archive-research-study-center/', '/instructional-media-collections-services/', '/billy-wilder-theater/', '/search/'],
    },
    hooks: {
      'prerender:generate'(route) {
        // TODO: fix issue with recursive fetches with query string, e.g.
        // `/enterprise/agencies?region=europe&amp;amp;amp;service=ecommerce&amp;amp;service=ecommerce&amp;service=content-marketing`
        /* if (route.route?.includes('&amp;')) {
          route.skip = true
        } */
        // console.log('prerender:generate', route)
      },
      async 'prerender:routes'(routes) {
        const allRoutes = []

        const response = await fetch(import.meta.env.CRAFT_ENDPOINT, {
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify({ query: 'query AllPages { entries(section: "ftva*") { uri, sectionHandle } }' })
        })

        const postPages = await response.json()
        // console.log('All pages', JSON.stringify(postPages.data.entries))
        if (postPages && postPages.data && postPages.data.entries) {
          /*
          * {
          *    "uri": null,
          *    "sectionHandle": "ftvaBillyWiderTheater"
          *  },
          */
          const postWithoutPayloadRoutes = postPages.data.entries.map(entry => '/' + entry.uri?.replace(/^ftva\//, ''))
          allRoutes.push(...postWithoutPayloadRoutes)
        }

        if (allRoutes.length) {
          for (const route of allRoutes) {
            routes.add(route)
          }
        }
        // eslint-disable-next-line no-console
        console.log('prerender:routes ctx.routes', routes)
      }
    },

  },

  runtimeConfig: {
    // Private keys are only available on the server
    esWriteKey: import.meta.env.ES_WRITE_KEY,

    // Public keys that are exposed to the client
    public: {
      craftGraphqlURL: import.meta.env.CRAFT_ENDPOINT || '',
      esReadKey: import.meta.env.ES_READ_KEY || '',
      esAlias: import.meta.env.ES_ALIAS || '',
      esIndexPrefix: import.meta.env.ES_INDEX_PREFIX || '',
      esTempIndex: import.meta.env.ES_INDEX_PREFIX + '-' + new Date().toISOString().toLowerCase().replaceAll(':', '-'),
      esURL: import.meta.env.ES_URL || '',
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
  },

  /*
     ** Global CSS
     */
  css: [
    // 'ucla-library-design-tokens/scss/fonts.scss',
    'ucla-library-design-tokens/scss/app-global.scss',
    '~/assets/styles/global.scss',
    // '@ucla-library-monorepo/ucla-library-website-components/style.css',
  ],
  features: {
    inlineStyles: false
  },

  typescript: {
    strict: false
  },

  modules: [[
    '@pinia/nuxt',
    {
      autoImports: ['defineStore', 'acceptHMRUpdate'],
    },
  ], 'nuxt-graphql-request', '@nuxtjs/sitemap', '@zadigetvoltaire/nuxt-gtm', '@ucla-library/component-library-nuxt-module'],

  // Transpile Vuetify for proper handling of CSS
  build: {
    transpile: ['nuxt-graphql-request', 'vuetify'],
  },

  site: {
    url: import.meta.env.SITEMAP_HOST || 'https://www.library.ucla.edu',
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
        endpoint: import.meta.env.CRAFT_ENDPOINT || '',
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

  experimental: {
    sharedPrerenderData: true, // Improves nuxt build performance
    buildCache: true, // Improves nuxt build performance
  },

  compatibilityDate: '2025-03-19',
})
