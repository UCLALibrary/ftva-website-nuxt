<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVATouringSeriesDetail from '../gql/queries/FTVATouringSeriesDetail.gql'

// COMPOSABLE
import removeTags from '~/utils/removeTags'
import { useContentIndexer } from '~/composables/useContentIndexer'

const { $graphql } = useNuxtApp()

const route = useRoute()

// GQL DATA
const { data, error } = await useAsyncData(`touring-events-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVATouringSeriesDetail, { slug: route.params.slug })
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.ftvaTouringSeries) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

// METADATA INFO FOR INDEXING
if (data.value.ftvaTouringSeries && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the event data using the composable during static build
    data.value.ftvaTouringSeries.sortTitle = normalizeTitleForAlphabeticalBrowseBy(data.value.ftvaTouringSeries.title)
    data.value.ftvaTouringSeries.groupName = 'Events'
    // Add the event series title and link data if available
    if (data.value.ftvaTouringSeries) {
      data.value.ftvaTouringSeries.eventSeriesTitle = data.value.ftvaTouringSeries[0]?.title || null
      data.value.ftvaTouringSeries.eventSeriesLink = data.value.ftvaTouringSeries[0]?.to || null
    }
    await indexContent(data.value.ftvaTouringSeries, route.params.slug)
    // console.log('Event indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX EVENT during static build:', error)
  }
}

const page = ref(_get(data.value, 'ftvaTouringSeries', {}))
const series = ref(_get(data.value, 'otherSeriesUpcoming', {}))
console.log(page.value)
console.log(series.value)

// PREVIEW LOGIC
watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'ftvaTouringSeries', {})
  series.value = _get(newVal, 'otherSeriesUpcoming', {})
})

useHead({
  title: page.value ? page.value.title : '... loading',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: removeTags(page.value.text)
    }
  ]
})

// const pageClasses = computed(() => {
//   return ['page', 'page-detail', 'page-detail--paleblue', 'page-touring-series-detail', 'page-bottom-spacer']
// })
</script>

<template>
  <main
    id="main"
    :class="pageClasses"
  >
  <SectionWrapper>
    <div class="one-column">
        <h3><pre>PAGE:<br/> {{page}}</pre></h3>
        <hr/><hr/>
        <h3><pre>SERIES:<br/> {{series}}</pre></h3>
    </div>
  </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/slug-pages.scss';

.page-touring-series-detail {
}
</style>
