export function useContentIndexer() {
  const esIndex = useRuntimeConfig().public.esTempIndex
  const esURL = useRuntimeConfig().public.esURL
  const esReadKey = useRuntimeConfig().public.esReadKey
  const esWriteKey = useRuntimeConfig().esWriteKey

  async function indexContent(data, slug) {
    try {
      if (data && slug && esIndex) {
        // console.log('this is the elasticsearch plugin: ', JSON.stringify(Object.keys(data).length), slug)

        // console.log(`Requesting URL: ${esURL}/${esIndex}/_doc/${slug}`)
        const docExists = await fetch(
                `${esURL}/${esIndex}/_doc/${slug}`,
                {
                  headers: {
                    Authorization: `ApiKey ${esReadKey}`,
                  },
                }
        )

        const body = await docExists.text()
        const docExistsResponseValue = JSON.parse(body)
        // console.log('Existing data in ES', docExistsResponseValue)

        if (docExistsResponseValue && docExistsResponseValue._source) {
          // console.log('GET-RESPONSE: ' + slug)
          const updateUrl = `${esURL}/${esIndex}/_update/${slug}`
          // console.log('ES update url', updateUrl)
          const postBody = {
            doc: data
          }
          // console.log('postBody', JSON.stringify(postBody))
          const updateResponse = await fetch(
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
          // console.log('Update document in ES', updateResponse)
          const updateJson = await updateResponse.text()
          // console.log('Update in ES', updateJson)
        } else {
          const response = await fetch(
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

          // console.log('Create a new document in ES:', await response.text())
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('not indexing anything')
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('skip indexing if connection times out  during builds in the mean time: ' + e.message)
      // eslint-disable-next-line no-console
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
