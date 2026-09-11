export default function useCalendarSearchFilter() {
  return { paginatedSearchFilters }
}

async function paginatedSearchFilters(
  sectionHandle,
  sort,
  orderBy,
  source = ['*'],
) {
  const config = useRuntimeConfig()
  // console.log(config.public.esReadKey)
  // console.log(config.public.esURL)
  if (
    config.public.esReadKey === '' ||
        config.public.esURL === '' ||
        config.public.esAlias === ''
  )
    return
  // console.log('(currentPage - 1) * documentsPerPage', (currentPage - 1) * documentsPerPage, currentPage, documentsPerPage)
  const response = await fetch(
        `${config.public.esURL}/${config.public.esAlias}/_search`,
        {
          headers: {
            Authorization: `ApiKey ${config.public.esReadKey}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            size: 2000,
            _source: [...source],
            query: {
              bool: {
                filter: [
                  ...parseSectionHandle(sectionHandle),
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

function parseSectionHandle(sectionHandle) {
  if (sectionHandle && sectionHandle === '') return []

  const boolQuery = []

  const sectionHandleTermQueryObj = {}
  const key = 'sectionHandle.keyword'
  sectionHandleTermQueryObj.term = {}
  sectionHandleTermQueryObj.term[key] = sectionHandle

  boolQuery.push(sectionHandleTermQueryObj)

  return boolQuery
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
