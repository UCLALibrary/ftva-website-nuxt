<script lang="ts" setup>
// COMPOSABLE
import { useContentIndexer } from '~/composables/useContentIndexer'
import removeTags from '~/utils/removeTags'
import FTVACollectionItem from '~/gql/queries/FTVACollectionItemDetail.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

console.log(route)
// DATA
// const { data, error } = await useAsyncData(`ftva-event-series-detail-${route.params.slug}`, async () => {
//   const data = await $graphql.default.request(FTVACollectionItem, { slug: route.params.slug, collectionSlug: route.params['collection-slug'] })
//   return data
// })

// console.log(data)

// if (error.value) {
//   throw createError({
//     ...error.value, statusMessage: 'Page not found .' + error.value, fatal: true
//   })
// }

// if (!data.value.ftvaEventSeries) {
//   throw createError({
//     statusCode: 404,
//     statusMessage: 'Page Not Found for ftvaEventSeries',
//     fatal: true
//   })
// }

// This is creating an index of the main content (not related content)
// if (data.value.ftvaEventSeries && import.meta.prerender) {
//   try {
//     // Call the composable to use the indexing function
//     const { indexContent } = useContentIndexer()
//     // Index the event series data using the composable during static build
//     await indexContent(data.value.ftvaEventSeries, route.params.slug)
//     // console.log('Event series indexed successfully during static build')
//   } catch (error) {
//     console.error('FAILED TO INDEX EVENT SERIES during static build:', error)
//   }
// }

// const page = ref(_get(data.value, 'ftvaEventSeries', {}))
</script>
<template>
  <main
    id="main"
    class="page page-detail"
  >
    DATA
  </main>
</template>