export async function useIndexAggregator() {
  const config = useRuntimeConfig()
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
              filter: {
                term: { 'sectionHandle.keyword': 'ftvaEvent' }
              }
            }
          },
          aggs: {
            'Event Type': {
              terms: {
                field: 'ftvaEventTypeFilters.title.keyword',
                size: 100
              }
            },
            'Screening Format': {
              terms: {
                field: 'ftvaScreeningFormatFilters.title.keyword',
                size: 100
              }
            }
          }
        })
      }
  )

  const data = await response.json()
  return data.aggregations
}
