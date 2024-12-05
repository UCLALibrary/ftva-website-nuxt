// TODO Convertthis composable into TypeScript

export default function useEventSeriesFilter() {
  return { paginatedEventSeriesFilters }
}

// create 3 queries for using JS obj PAST CUrrent  UPcoming
// Create constsants outside paginatedEventSeriesFilters the use it inside paginatedEventSeriesFilters

async function paginatedEventSeriesFilters(
  currentPage = 1,
  documentsPerPage = 10,
  view, // tab views past,upcoming,
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
  console.log('(currentPage - 1) * documentsPerPage', (currentPage - 1) * documentsPerPage, currentPage, documentsPerPage)
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
                  ...parseDateRange(dates, view)
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

// the view argument is refering to the past series upcoming series, current seroies tab view
// function parseDateRange(dates, view) {
//   if (!dates || dates.length === 0) return [] // Ensure it returns early if dates are empty

//   const dateRange = []

//   switch (view) {
//     case 'past series':
//       const dateObj = { range: {} }
//       dateObj.range.endDate = {}
//       dateObj.range.endDate.lt = dates[0]
//       dateRange.push(dateObj)
//       return dateRange
//       break
//     case 'current series':
//       dateObj.range.startDate.gte = dates[0]
//       break
//     case 'upcoming series':

//       break

//     default:
//       break
//   }
//   if (dates.length === 2) {
//     dateObj.range.startDate.gte = dates[0]
//     dateObj.range.startDate.lte = dates[1]
//   } else {
//     dateObj.range.startDate.gte = dates[0]
//     dateObj.range.startDate.lte = dates[0] // This is needed for exact date match
//   }

//   // dateObj.range.startDate.format = 'yyyy-MM-dd' // TODO will decide the date format later

//   return dateObj
// }

function parseDateRange(dates, view) {
  if (!dates || dates.length === 0) return []

  const dateRange = []

  const dateObj = { range: {} }

  switch (view) {
    case 'past series':
      // Events that ended before the first date
      dateObj.range.endDate = { lt: dates[0] }
      dateRange.push(dateObj)
      break

    case 'current series':
      // Events that started on or after the first date
      dateObj.range.startDate = { gte: dates[0] }

      // If two dates are provided, add an upper limit
      if (dates.length === 2) {
        dateObj.range.startDate.lte = dates[1]
      }
      dateRange.push(dateObj)
      break

    case 'upcoming series':
      // Events that start on or after the first date
      dateObj.range.startDate = { gte: dates[0] }
      dateRange.push(dateObj)
      break

    default:
      // If no valid view is provided, return an empty array
      return []
  }

  return dateRange // Always return an array of filters
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
