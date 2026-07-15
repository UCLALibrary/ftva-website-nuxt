export default function useFilmmakersListSearch() {
  return { paginatedFilmmakersQuery }
}

async function paginatedFilmmakersQuery(
  currentPage = 1,
  documentsPerPage = 12,
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
                  'sectionHandle.keyword': 'ftvaLARebellionIndividual'
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
