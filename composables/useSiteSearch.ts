export default function useSiteSearch() {
  const config = useRuntimeConfig()
  const searchFields = [
    'title^3',
    'nameFirst^2',
    'nameLast^2',
    'summary^2',
    'richText^2',
    'guestSpeaker^2',
    'introduction^2',
    'eventDescription^2',
    'acknowledements^2',
    'aboutTheAuthor^2',
    'ftvaCollectionType^2',
    'sectionHandle^2',
    'groupName^2',
  ]
  async function aggregationsQuery() {
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
            must: {
              wildcard: { 'sectionHandle.keyword': { value: 'ftva*' } }
            }
          }
        },
        aggs: {
          'Filter Results': {
            terms: {
              field: 'groupName.keyword',
              size: 100
            }
          }
        }
      })
    })
    const data = await response.json()
    return data.aggregations
  }
  type FilterItem = { [key: string]: string[] }

  async function paginatedSiteSearchQuery(
    keyword = '*',
    currentPage = 1,
    documentsPerPage = 10,
    queryFilters: FilterItem = {},
    sort,
    orderBy,
  ) {
    console.log('paginatedSiteSearchQuery', keyword, currentPage, documentsPerPage, queryFilters)
    if (!config.public.esReadKey || !config.public.esURL || !config.public.esAlias)
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
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query: keyword,
                    fields: [...searchFields],
                    type: 'best_fields',
                  },
                },
              ],
              should: [
                ...parseShouldQuery(keyword, searchFields),
              ],
              filter: [...parseFilterQuery(queryFilters)],
            },
          },
          aggs: {
            'Filter Results': {
              terms: {
                field: 'groupName.keyword',
                size: 100
              }
            }
          },
          ...parseSort(sort, orderBy),
        }),
      }
    )

    let data = await response.json()
    if (data?.hits?.total.value === 0) {
      data = performFuzzySearchOnAllFields(keyword, ['*'], queryFilters, currentPage = 1,
        documentsPerPage = 10, sort, orderBy)
    }
    return data
  }
  interface ParseQueryType {
    sort: {
      [key: string]: {
        order: string
      }
    }[]
  }
  function parseSort(sortField, orderBy = 'asc') {
    if (!sortField || sortField === '') return {}
    const parseQuery: ParseQueryType = { sort: [] }
    /**
       * { "_score": "desc" },
       */
    parseQuery.sort[0] = {}
    parseQuery.sort[0]._score = {
      order: 'desc'
    }
    parseQuery.sort[1] = {}
    parseQuery.sort[1][sortField] = {
      order: orderBy
    }

    return parseQuery
  }

  function parseShouldQuery(keyword: string, searchFields: any) {
    /*
    {
                  multi_match: {
                    query: keyword,
                    fields: [...searchFields],
                    fuzziness: "AUTO"
                  }
                },
                {
                  match_phrase: {
                    title: {
                      query: keyword,
                      boost: 3
                    }
                  }
                }
    */
    if (keyword === '*') return [{ match_all: {} }]
    else
      return [
        {
          multi_match: {
            query: keyword,
            fields: [...searchFields],
            fuzziness: 'AUTO'
          }
        },
        {
          match_phrase: {
            title: {
              query: keyword,
              boost: 3
            }
          }
        },
      ]
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
  async function performFuzzySearchOnAllFields(
    keyword: string, searchFields: string[], queryFilters: { [key: string]: string[] }, currentPage: number, documentsPerPage: number, sort: string, orderBy: string) {
    const config = useRuntimeConfig()
    if (!config.public.esReadKey || !config.public.esURL || !config.public.esAlias)
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
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query: keyword,
                    fields: searchFields,
                    fuzziness: 'AUTO',
                    type: 'best_fields',
                  },
                },
              ],
              filter: [...parseFilterQuery(queryFilters)],
            },
          },
          aggs: {
            'Filter Results': {
              terms: {
                field: 'groupName.keyword',
                size: 100
              }
            }
          },
          ...parseSort(sort, orderBy),
        }),
      }
    )
    return await response.json()
  }

  return { paginatedSiteSearchQuery, aggregationsQuery }
}
