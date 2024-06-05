import { defineNuxtModule, useLogger } from 'nuxt/kit'
import fetch from 'node-fetch'

export default defineNuxtModule({
  setup(options, nuxt) {
    const logger = useLogger('finalize-module')

    async function updateAliases() {
      const response = await fetch(`${nuxt.options.runtimeConfig.public.esURL}/_aliases`, {
        headers: {
          Authorization: `ApiKey ${nuxt.options.runtimeConfig.esWriteKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          actions: [
            {
              remove: {
                index: '*',
                alias: nuxt.options.runtimeConfig.public.esAlias,
              },
            },
            {
              add: {
                indices: [nuxt.options.runtimeConfig.public.esTempIndex],
                alias: nuxt.options.runtimeConfig.public.esAlias,
              },
            },
          ],
        }),
      })

      const body = await response.text()
      try {
        const jsonData = JSON.parse(body)
        logger.warn('Alias updated: ', JSON.stringify(jsonData), nuxt.options.runtimeConfig.public.esAlias)
      } catch (err) {
        logger.error('Error:', err)
        logger.error('Response body:', body)
        throw err
      }
    }

    nuxt.hooks.hook('nitro:build:public-assets', async () => {
      logger.warn('Ready for generating alias...')
      try {
        await updateAliases()
      } catch (err) {
        logger.error('An error occurred:', err)
      }
    })
  },
})
