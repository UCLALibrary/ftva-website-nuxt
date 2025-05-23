export default function useListSearchFilter() {
  return { paginatedSearchFilters, paginatedCollectionSearchFilters }
}

async function paginatedCollectionSearchFilters(
  currentPage = 1,
  documentsPerPage = 10,
  sectionHandle,
  title,
  filters,
  orderBy,
  source = ['*'],) {
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
                  ...parseSectionHandle(sectionHandle),
                  ...parseFilterQuery(filters),
                  {
                    term: {
                      'ftvaAssociatedCollections.title.keyword': title
                    }
                  }
                ]
              },
            },
            sort: [
              {
                ftvaSortDate: {
                  order: orderBy,
                  missing: '_last'
                }
              }
            ],
          }),
        }
  )

  const data = await response.json()
  return data
}

async function paginatedSearchFilters(
  currentPage = 1,
  documentsPerPage = 10,
  sectionHandle,
  filters,
  dates,
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
            from: (currentPage - 1) * documentsPerPage,
            size: documentsPerPage,
            _source: [...source],
            query: {
              bool: {
                filter: [
                  ...parseSectionHandle(sectionHandle),
                  ...parseFilterQuery(filters),
                  parseDateRange(dates)
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
function getTodaysDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0') // Months are 0-based
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
function parseDateRange(dates) {
  const dateObj = { range: { startDate: {} } }

  if (!dates || dates.length === 0) {
    dateObj.range.startDate.gte = getTodaysDate()
    return dateObj // Always return upcoming events when no date filter selected
  }

  dateObj.range.startDate = {}

  if (dates.length === 2) {
    dateObj.range.startDate.gte = dates[0]
    dateObj.range.startDate.lte = dates[1]
  } else {
    dateObj.range.startDate.gte = dates[0]
    dateObj.range.startDate.lte = dates[0] // This is needed for exact date match
  }

  // dateObj.range.startDate.format = 'yyyy-MM-dd' // TODO will decide the date format later

  return dateObj
}

function parseFilterQuery(filters) {
  if (!filters || filters.length === 0) return []
  const boolQuery = []
  /* Example structure to return for ES
    [
      {
        "term": {
          "locations.title.keyword":"Powell"
        }
      }
    ]
  */
  for (const key in filters) {
    // console.log(key)
    if (Array.isArray(filters[key]) && filters[key].length > 0) {
      const filterObj = {
        terms: {}
      }
      filterObj.terms[key] = filters[key]
      boolQuery.push(filterObj)
    } else if (!Array.isArray(filters[key]) && filters[key] !== '') {
      const filterObj = {
        term: {}
      }
      filterObj.term[key] = filters[key]
      boolQuery.push(filterObj)
    }
  }
  // console.log("bool query:"+JSON.stringify(boolQuery))
  return boolQuery
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
