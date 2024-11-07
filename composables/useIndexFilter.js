export default function useIndexFilter() {
  return { indexFilters }
}

async function indexFilters(
  sectionHandle,
  filters,
  tagLabels,
  date, // array of single or multiple dates?
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

  const response = await fetch(
        `${config.public.esURL}/${config.public.esAlias}/_search`,
        {
          headers: {
            Authorization: `ApiKey ${config.public.esReadKey}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            size: '1000',
            _source: [...source],
            query: {
              bool: {
                filter: [
                  ...parseSectionHandle(sectionHandle),
                  ...parseTagLabels(tagLabels),

                  // Is parseFilter needed?
                  ...parseFilterQuery(filters),
                  // {
                  //   range: {
                  //     startDate: {
                  //       gte: '2015-01-01'
                  //     }
                  //   }
                  // }
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

// What will date query/search arguments look like?
function parseDateRange(date) {}

function parseFilterQuery(filters) {
  if (!filters || filters.length === 0) return []
  const boolQuery = []
  /* Example structure we want this function to return for ES
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

  sectionHandleTermQueryObj.term = {}
  sectionHandleTermQueryObj.term.sectionHandle = sectionHandle

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

function parseTagLabels(tagLabels) {
  if (!tagLabels || tagLabels.length === 0) return []

  const tags = []

  tagLabels.forEach(tag => tags.push(tag))

  const tagLabelQueryObj = {}
  tagLabelQueryObj.term.tagLabel = tags

  return tagLabelQueryObj
}
