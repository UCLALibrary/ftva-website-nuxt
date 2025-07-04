import { defineNuxtModule } from 'nuxt/kit'
import fetch from 'node-fetch'
export default defineNuxtModule({

  setup(options, nuxt) {
    // console.log('Nuxt module start ')
    // console.log('Is the environement local Dev' + import.meta.dev)
    if (!nuxt.options._prepare && !import.meta.dev) {
      nuxt.hooks.hook('nitro:init', async (nitro) => {
        // console.log('Ready to create library temp index...')

        const esLibraryIndexTemp = nuxt.options.runtimeConfig.public.esTempIndex
        // console.log('Index named:' + esLibraryIndexTemp)
        // https://www.elastic.co/guide/en/elasticsearch/reference/current/flattened.html
        try {
          const response = await fetch(`${nuxt.options.runtimeConfig.public.esURL}/${esLibraryIndexTemp}`, {
            headers: {
              Authorization: `ApiKey ${nuxt.options.runtimeConfig.esWriteKey}`,
              'Content-Type': 'application/json',
            },
            method: 'PUT',
            body: JSON.stringify({
              mappings: {
                properties: {
                  blocks: { // TODO Making all flexible blocks flattened in ES to avoid any performnce issues further
                    type: 'flattened'
                  },
                  titleBrowse: {
                    type: 'keyword',
                    normalizer: 'lowercase_normalizer'
                  }
                }
              },
              settings: {
                'index.mapping.total_fields.limit': 1500, // Or a suitable limit
                analysis: {
                  char_filter: {
                    remove_hyphen: {
                      type: 'pattern_replace',
                      pattern: '-',
                      replacement: ''
                    }
                  },
                  tokenizer: {
                    edge_ngram_tokenizer: {
                      type: 'edge_ngram',
                      min_gram: 2,
                      max_gram: 20,
                      token_chars: ['letter', 'digit']
                    }
                  },
                  normalizer: {
                    lowercase_normalizer: {
                      type: 'custom',
                      filter: ['lowercase', 'asciifolding']
                    }
                  },
                  analyzer: {
                    default: {
                      type: 'custom',
                      tokenizer: 'standard',
                      char_filter: ['remove_hyphen'],
                      filter: ['stemmer', 'lowercase', 'stop', 'asciifolding'],
                    },
                    default_search: {
                      type: 'custom',
                      tokenizer: 'standard',
                      char_filter: ['remove_hyphen'],
                      filter: ['stemmer', 'lowercase', 'stop', 'asciifolding'],
                    }
                  },
                }
              }
            }),
          })
          const body = await response.text()
          const testJson = JSON.parse(body)
          // console.log('Index created:' + JSON.stringify(testJson))
          // console.log('Elastic Search index created succesfully!')
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Error:', err)
          // eslint-disable-next-line no-console
          console.error('Response body:', body)
          throw err
        }
      })
    }
    // console.log('Nuxt module end ')
  }
})
