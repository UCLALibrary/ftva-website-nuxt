export async function useCollectionAggregator(fields, sectionHandle, title) {
  // console.log("search text: "+fields)
  const config = useRuntimeConfig()
  if (!fields || fields.length === 0) return
  const response = await fetch(
    `${config.public.esURL}/${config.public.esAlias}/_search`, {
      headers: {
        Authorization: `ApiKey ${config.public.esReadKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        size: 0,
          "query": {
              "bool": {
                "filter": [
                  {
                    "term": {
                      "sectionHandle.keyword": sectionHandle
                    }
                  },
                  {
                    "term": {
                      "ftvaAssociatedCollections.keyword": title
                    }
                }
              ]
            }
        },
        aggs: {
          ...parseFieldNames(fields),
        },
      }),
    }
  )
  const data = await response.json()
  return data.aggregations
}

function parseFieldNames(fields) {
  const aggsFields = {}
  for (const element of fields) {
    // console.log(element)
    aggsFields[element.label] = {
      terms: {
        field: element.esFieldName,
        size: 100,
      },
    }
  }
  // console.log("aggsFields:" + JSON.stringify(aggsFields))
  return aggsFields
}