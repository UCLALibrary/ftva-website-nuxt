/*
Sample
    {"id":"j6tUj4IBzYVXfPB9-JvU","name":"dev-es-key","api_key":"N_f0_5WSSae3QOvm4hlq0g","encoded":"ajZ0VWo0SUJ6WVZYZlBCOS1KdlU6Tl9mMF81V1NTYWUzUU92bTRobHEwZw=="}
*/

async function getMapping() {
  const config = useRuntimeConfig()
  if (
    config.public.esReadKey === '' ||
        config.public.esURL === '' ||
        config.public.esAlias === ''
  )
    return
  const response = await fetch(
        `${config.public.esURL}/${config.public.esAlias}/_mapping`, {
          headers: {
            Authorization: `ApiKey ${config.public.esReadKey}`,
            // 'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
  )
  const data = await response.json()
  return data
}

async function getAggregations(fields, sectionHandle) {
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
            query: {
              query_string: {
                query: sectionHandle,
                default_field: 'sectionHandle'
              },
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

async function keywordSearchWithFilters(
  keyword = '*:*',
  searchFields,
  sectionHandle,
  filters,
  sort,
  orderBy,
  source = ['*'],
  aggFields = [],
  extraFilters = [],
) {
  // var data_url = new URL(`${ES_URL}/apps-dev-library-website/_search`)
  console.log('In data api keywordsearchwithfilters')
  const config = useRuntimeConfig()
  // console.log(config.public.esReadKey)
  // console.log(config.public.esURL)
  if (
    config.public.esReadKey === '' ||
        config.public.esURL === '' ||
        config.public.esAlias === ''
  )
    return
  // console.log('keyword:' + keyword)
  // console.log('filters:' + filters)
  // console.log('sort:' + sort)

  const testquery = JSON.stringify({
    _source: [...source],
    query: {
      bool: {
        must: [{
          query_string: {
            query: keyword,
            fields: [...searchFields],
            fuzziness: 'auto',
          },
        },
        ...parseSectionHandle(sectionHandle),
        ...parseFilterQuery(filters),
        ...extraFilters,
        ],
      },
    },
    ...parseSort(sort, orderBy),
    aggs: {
      ...parseFieldNames(aggFields),
    },
  })
  // console.log('this is the query: ' + testquery)

  const response = await fetch(
        `${config.public.esURL}/${config.public.esAlias}/_search`, // replace alias with indexname
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
                must: [{
                  query_string: {
                    query: keyword,
                    fields: [...searchFields],
                    fuzziness: 'auto',
                  },
                },
                ...parseSectionHandle(sectionHandle),
                ...parseFilterQuery(filters),
                ...extraFilters,
                ],
              },
            },
            ...parseSort(sort, orderBy),
            aggs: {
              ...parseFieldNames(aggFields),
            },
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

function parseSectionHandle(sectionHandle) {
  // console.log(sectionHandle)
  if (sectionHandle && sectionHandle === '') return []
  // console.log("where is the execution")
  const boolQuery = []
  const sectionHandleTermQueryObj = {}
  sectionHandleTermQueryObj.query_string = {}
  sectionHandleTermQueryObj.query_string.query = sectionHandle
  boolQuery.push(sectionHandleTermQueryObj)
  // console.log("query:" + boolQuery)
  return boolQuery
}

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

function parseFieldNames(fields) {
  const aggsFields = {}
  for (const element of fields) {
    // console.log(element)
    aggsFields[element.label] = {
      terms: {
        field: element.esFieldName,
        size: 25,
      },
    }
  }
  // console.log("aggsFields:" + JSON.stringify(aggsFields))
  return aggsFields
}

export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      dataApi: {
        getMapping,
        keywordSearchWithFilters,
        getAggregations,
      }
    }
  }
})
