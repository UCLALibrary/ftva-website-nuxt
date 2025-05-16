export default function useCollectionListSearch() {
  return { paginatedCollectionListQuery }
}

async function paginatedCollectionListQuery(
  collectionType,
  currentPage = 1,
  documentsPerPage = 12,
  extraSearchFilter,
  source = ['*'],
) {
  const config = useRuntimeConfig()
  if (
    config.public.esReadKey === '' ||
        config.public.esURL === '' ||
        config.public.esAlias === ''
  )
    return

  // Build the must clause conditionally
  const mustClause = []

  if (extraSearchFilter && extraSearchFilter !== '*') {
    mustClause.push({
      prefix: {
        titleBrowse: {
          value: extraSearchFilter.toLowerCase() // because normalizer is lowercase
        }
      }
    })
  }

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
                  'sectionHandle.keyword': 'ftvaCollection'
                }
              },
              ...parseCollectionType(collectionType)
            ],
            must: mustClause
          },
        },
        sort: [
          {
            'title.keyword': {
              order: 'asc'
            }
          }
        ]
      }),
    }
  )

  const data = await response.json()
  return data
}

function parseCollectionType(collectionType) {
  if (collectionType && collectionType === '') return []

  const boolQuery = []

  const collectionTypeQueryObj = {}
  const key = 'ftvaCollectionType.keyword'
  collectionTypeQueryObj.term = {}
  collectionTypeQueryObj.term[key] = collectionType

  boolQuery.push(collectionTypeQueryObj)

  return boolQuery
}
