export function useContentIndexer() {
  const esIndex = useRuntimeConfig().public.esTempIndex
  const esURL = useRuntimeConfig().public.esURL
  const esReadKey = useRuntimeConfig().public.esReadKey
  const esWriteKey = useRuntimeConfig().esWriteKey

  async function indexContent(data, slug) {
    try {
      if (data && slug && esIndex) {
        /* console.log(
                  "this is the elasticsearch plugin: " + JSON.stringify(data)
              ) */
        // console.log(`Requesting URL: ${esURL}/${esIndex}/_doc/${slug}`)
        const docExistsResponseValue = await $fetch(
                  `${esURL}/${esIndex}/_doc/${slug}`,
                  {
                    headers: {
                      Authorization: `ApiKey ${esReadKey}`,
                    },
                  }
        )

        // console.log('Existing data in ES', docExistsResponseValue)

        if (docExistsResponseValue && docExistsResponseValue._source) {
          // console.log('GET-RESPONSE: ' + slug)
          const updateUrl = `${esURL}/${esIndex}/_update/${slug}`
          // console.log('ES update url', updateUrl)
          const postBody = {
            doc: data
          }
          // console.log('postBody', JSON.stringify(postBody))
          const updateJson = await $fetch(
                      `${esURL}/${esIndex}/_update/${slug}`,
                      {
                        headers: {
                          Authorization: `ApiKey ${esWriteKey}`,
                          'Content-Type': 'application/json',
                        },
                        method: 'POST',
                        body: JSON.stringify(postBody),
                      }
          )

          console.log('Update in ES', updateJson)
        } else {
          const response = await $fetch(
                      `${esURL}/${esIndex}/_doc/${slug}`,
                      {
                        headers: {
                          Authorization: `ApiKey ${esWriteKey}`,
                          'Content-Type': 'application/json',
                        },
                        method: 'POST',
                        body: JSON.stringify(data),
                      }
          )
        }
      } else {
        console.warn('not indexing anything')
      }
    } catch (e) {
      console.error('skip indexing if connection times out  during builds in the mean time: ' + e.message)
      console.warn('skip indexing if connection times out  during builds in the mean time: ' + e.message)
      throw new Error('Elastic Search Indexing failed ' + e) // TODO uncomment when cause is clear
    }
  }

  return {
    indexContent
  }
}

// Checks the page slug
// Calls ES (Elastic Search)
//  Checks if the document exists in ES
//   if the document already exists
//    it overwrites/replaces it in the index
//   if the document doesn't exist
//    it adds it to the index
