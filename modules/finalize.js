import { defineNuxtModule, useLogger } from 'nuxt/kit'
import fetch from 'node-fetch'

export default defineNuxtModule({
  setup(options, nuxt) {
    const logger = useLogger('finalize-module')

    async function indexExists(esUrl, index, headers) {
      const response = await fetch(`${esUrl}/${encodeURIComponent(index)}`, {
        headers,
        method: 'HEAD',
      })

      if (response.status === 200) {
        return true
      }

      if (response.status === 404) {
        return false
      }

      logger.warn(
        `Unexpected response while checking if index "${index}" exists: ${response.status}`
      )
      return false
    }

    async function deleteIndices(indicesToDelete, esUrl, headers, tempIndex) {
      // Step 3: Delete the old indices
      try {
        for (const index of indicesToDelete) {
          // Skip deleting the new temp index
          if (index === tempIndex) {
            continue
          }

          logger.warn(`Deleting index: ${index}`)
          const deleteResponse = await fetch(`${esUrl}/${index}`, {
            headers,
            method: 'DELETE',
          })

          const deleteBody = await deleteResponse.text()
          logger.warn(`Deleted index ${index}: ${deleteBody}`)
        }
      } catch (err) {
        logger.error('Error deleting indices:', err)
      }
    }

    async function updateAliasesAndCleanup() {
      const esUrl = nuxt.options.runtimeConfig.public.esURL
      const alias = nuxt.options.runtimeConfig.public.esAlias
      const tempIndex = nuxt.options.runtimeConfig.public.esTempIndex
      const headers = {
        Authorization: `ApiKey ${nuxt.options.runtimeConfig.esWriteKey}`,
        'Content-Type': 'application/json',
      }
      // console.log('This is alias rest api call url :', `${esUrl}/_alias/${alias}`)
      // Step 1: Fetch the alias and its indices
      let indicesToDelete = []
      try {
        const aliasResponse = await fetch(`${esUrl}/_alias/${alias}`, {
          headers,
          method: 'GET',
        })

        const aliasData = await aliasResponse.json()

        if (!aliasData || Object.keys(aliasData).length === 0) {
          logger.warn('No indices found for alias:', alias)
        } else if (!Object.keys(aliasData).includes('error') && !Object.keys(aliasData).includes('status')) {
          indicesToDelete = Object.keys(aliasData)
        }
        logger.warn('Indices associated with alias:', indicesToDelete)
      } catch (err) {
        logger.error('Error fetching alias indices:', err)
        await deleteIndices(indicesToDelete, esUrl, headers, tempIndex)
        return
      }

      try {
        const tempExists = await indexExists(esUrl, tempIndex, headers)

        if (!tempExists) {
          logger.warn(
            `Temp index "${tempIndex}" does not exist. Leaving alias "${alias}" unchanged.`
          )
          return
        }
      } catch (err) {
        logger.error(
          `Error checking if temp index "${tempIndex}" exists. Leaving alias "${alias}" unchanged:`,
          err
        )
        await deleteIndices(indicesToDelete, esUrl, headers, tempIndex)
        return
      }

      // Step 2: Update the alias with the new index
      try {
        const updateAliasResponse = await fetch(`${esUrl}/_aliases`, {
          headers,
          method: 'POST',
          body: JSON.stringify({
            actions: [
              {
                remove: { index: '*', alias },
              },
              {
                add: { indices: [tempIndex], alias },
              },
            ],
          }),
        })

        const updateAliasBody = await updateAliasResponse.json()

        if (updateAliasBody.status && updateAliasBody.status !== 200) {
          logger.error('Error updating alias:', updateAliasBody)
          await deleteIndices(indicesToDelete, esUrl, headers, tempIndex)
          return
        }
        logger.warn('Alias updated:', updateAliasBody)
      } catch (err) {
        logger.error('Error updating alias:', err)
        await deleteIndices(indicesToDelete, esUrl, headers, tempIndex)
        return
      }

      // Step 3: Delete the old indices
      await deleteIndices(indicesToDelete, esUrl, headers, tempIndex)
    }

    nuxt.hooks.hook('nitro:build:public-assets', async () => {
      logger.warn('Ready for generating alias...')
      try {
        await updateAliasesAndCleanup()
      } catch (err) {
        logger.error('An error occurred:', err)
      }
    })
  },
})
