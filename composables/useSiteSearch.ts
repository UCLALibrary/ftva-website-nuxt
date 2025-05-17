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
    'sectionHandle^2'
  ]
  async function paginatedSiteSearchQuery(
    keyword = '*',
    currentPage = 1,
    documentsPerPage = 10,
    sort,
    orderBy,
  ) {
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
              // filter: [...parseFilterQuerySiteSearch(queryFilters, configMapping)],
            },
          },
          // ...parseSort(sort, orderBy),
        }),
      }
    )

    const data = await response.json()
    return data
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
  return { paginatedSiteSearchQuery }
}
