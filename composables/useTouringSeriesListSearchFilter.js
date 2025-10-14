export default function useTouringSeriesListSearchFilter() {
  return { pastTouringSeriesQuery, currentTouringSeriesQueryCurrent, currentTouringSeriesQueryOngoing }
}

async function pastTouringSeriesQuery(
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
                  'sectionHandle.keyword': 'ftvaListingTouringSeries'
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

async function currentTouringSeriesQueryCurrent(
  currentPage = 1,
  documentsPerPage = 10,
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
                  'sectionHandle.keyword': 'ftvaListingTouringSeries',
                },
              },
            ],
            should: [
              {
                term: {
                  ongoing: true,
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
            minimum_should_match: 1,
          }
        },
        sort: [{ ongoing: { order: 'asc' } }, { startDate: { order: 'asc' } }],
      }),
    }
  )

  const data = await response.json()
  return data
}

async function currentTouringSeriesQueryOngoing(
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
                  'sectionHandle.keyword': 'ftvaListingTouringSeries',
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
