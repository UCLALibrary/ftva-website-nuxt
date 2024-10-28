export async function useIndexAggregator(fields) {
  // fail gracefully if no fields are provided
  if (!fields || fields.length === 0) return

  const config = useRuntimeConfig()
  // TODO is fetch path correct? ticket mentioned Alias /_search
  const response = await fetch(
      `${config.public.esURL}/${config.public.esAlias}/_search`, {
        headers: {
          Authorization: `ApiKey ${config.public.esReadKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          size: 0,
          query: {
            bool: {
              filter: [
                { term: { "sectionHandle.keyword": "ftvaEvent" } },
              ],
            },
          },
          aggs: {
            // TODO is space correct?
            "Event Type": {
              terms: {
                field: "tagLabels.title.keyword",
                size: 100
              },
            },
          },
        }),
      }
  )
  
  const data = await response.json()
  return data.aggregations
}