// TODO Convert this composable into TypeScript

export default function useEventSeriesListSearchFilter() {
  return { pastEventSeriesQuery, currentEventSeriesQueryCurrent, currentEventSeriesQueryOngoing }
}

async function pastEventSeriesQuery(
  currentPage = 1,
  documentsPerPage = 10,
  sort,
  orderBy,
  source = ['*'],
) {
  const config = useRuntimeConfig()
  if (
    config.public.esReadKey === '' ||
        config.public.esURL === '' ||
        config.public.esAlias === ''
  )
    return

  const response = await fetch(
    `${config.public.esURL}/${config.public.esAlias}/_search`,
    {
      headers: {
        Authorization: `ApiKey ${config.public.esReadKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        from: (currentPage - 1) * documentsPerPage,
        size: documentsPerPage,
        _source: [...source],
        query: {
          bool: {
            filter: [
              {
                term: {
                  'sectionHandle.keyword': 'ftvaEventSeries'
                }
              },
              {
                range: {
                  endDate: {
                    lt: 'now/d-8h'
                  }
                }
              }
            ]
          },
        },
        ...parseSort(sort, orderBy),
      }),
    }
  )

  const data = await response.json()
  return data
}

async function currentEventSeriesQueryCurrent(
  currentPage = 1,
  documentsPerPage = 10,
  sort,
  orderBy,
  source = ['*'],
) {
  const config = useRuntimeConfig()
  if (
    config.public.esReadKey === '' ||
        config.public.esURL === '' ||
        config.public.esAlias === ''
  )
    return

  const response = await fetch(
    `${config.public.esURL}/${config.public.esAlias}/_search`,
    {
      headers: {
        Authorization: `ApiKey ${config.public.esReadKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        from: (currentPage - 1) * documentsPerPage,
        size: documentsPerPage,
        _source: [...source],
        query: {
          bool: {
            filter: [
              {
                term: {
                  'sectionHandle.keyword': 'ftvaEventSeries',
                },
              },
            ],
            should: [
              {
                term: {
                  ongoing: false,
                },
              },
              {
                range: {
                  endDate: {
                    gte: 'now/d-8h',
                  },
                },
              },
            ],
            minimum_should_match: 2,
          }
        },
        ...parseSort(sort, orderBy),
      }),
    }
  )

  const data = await response.json()
  return data
}

async function currentEventSeriesQueryOngoing(
  currentPage = 1,
  documentsPerPage = 10,
  sort,
  orderBy,
  source = ['*'],
) {
  const config = useRuntimeConfig()
  if (
    config.public.esReadKey === '' ||
        config.public.esURL === '' ||
        config.public.esAlias === ''
  )
    return

  const response = await fetch(
    `${config.public.esURL}/${config.public.esAlias}/_search`,
    {
      headers: {
        Authorization: `ApiKey ${config.public.esReadKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        from: (currentPage - 1) * documentsPerPage,
        size: documentsPerPage,
        _source: [...source],
        query: {
          bool: {
            filter: [
              {
                term: {
                  'sectionHandle.keyword': 'ftvaEventSeries',
                },
              },
              {
                term: {
                  ongoing: true,
                },
              }
            ]
          }
        },
        ...parseSort(sort, orderBy),
      }),
    }
  )

  const data = await response.json()
  return data
}

function parseSort(sortField, orderBy = 'asc') {
  if (!sortField || sortField === '') return {}
  const parseQuery = {}
  parseQuery.sort = []
  parseQuery.sort[0] = {}
  parseQuery.sort[0][sortField] = {
    order: orderBy
  }

  return parseQuery
}
