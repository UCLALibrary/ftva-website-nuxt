// TODO Convert this composable into TypeScript

export default function useEventSeriesListSearchFilter() {
  return { pastEventSeriesQuery, currentEventSeriesQuery }
}

async function pastEventSeriesQuery(
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
        // from: (currentPage - 1) * documentsPerPage,
        // size: documentsPerPage,
        _source: [...source],
        query: {
          bool: {
            filter: [
              {
                term: {
                  "sectionHandle.keyword": "ftvaEventSeries"
                }
              },
              {
                range: {
                  endDate: {
                    lt: "now/d-8h"
                  }
                }
              }
            ]
          },
        }
      }),
    }
  )

  const data = await response.json()
  return data
}

async function currentEventSeriesQuery(
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
        // from: (currentPage - 1) * documentsPerPage,
        // size: documentsPerPage,
        _source: [...source],
        query: {
          bool: {
            filter: [
              {
                term: {
                  "sectionHandle.keyword": "ftvaEventSeries"
                }
              },
              {
                range: {
                  startDate: {
                    gte: "now/d-8h"
                  }
                }
              }
            ]
          },
        }
      }),
    }
  )

  const data = await response.json()
  return data
}

// async function eventSeriesQuery(
//   currentPage = 1,
//   documentsPerPage = 10,
//   view = 'current-series', // tab views past or current
//   sort,
//   orderBy,
//   source = ['*'],
// ) {
//   const config = useRuntimeConfig()
//   if (
//     config.public.esReadKey === '' ||
//         config.public.esURL === '' ||
//         config.public.esAlias === ''
//   )
//     return

//   const response = await fetch(
//     `${config.public.esURL}/${config.public.esAlias}/_search`,
//     {
//       headers: {
//         Authorization: `ApiKey ${config.public.esReadKey}`,
//         'Content-Type': 'application/json',
//       },
//       method: 'POST',
//       body: JSON.stringify({
//         // from: (currentPage - 1) * documentsPerPage,
//         // size: documentsPerPage,
//         _source: [...source],
//         query: {
//           bool: {
//             filter: [
//               {
//                 term: {
//                   "sectionHandle.keyword": "ftvaEventSeries"
//                 }
//               },
//               ...parseView(view)
//             ]
//           },
//         }
//       }),
//     }
//   )

//   const data = await response.json()
//   return data
// }

// function parseView(view) {
//   return view === 'current-series'
//   ? range: { endDate: { lt: "now/d-8h" } }
//   : range: { endDate: { gte: "now/d-8h" } }
// }
