<script setup>
// COMPONENTS
import { DividerWayFinder, SectionStaffArticleList, SectionPagination } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL - start
import FTVAEventSeriesList from '../gql/queries/FTVAEventSeriesList.gql'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('series-list', async () => {
  const data = await $graphql.default.request(FTVAEventSeriesList)
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entries) {
  // console.log('no data')
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

const heading = ref(_get(data.value, 'entry', {}))
const page = ref(_get(data.value, 'entries', {}))
// GQL - End

// TYPES
// interface EventItem {
//   _source: {
//     uri: string
//     title: string
//     startDate: string
//     endDate: string
//     ongoing: boolean
//     imageCarousel?: { image: { url: string }[] }[]
//     eventDescription?: string
//     [key: string]: any
//   }
//   [key: string]: any
// }

// const events = ref < EventItem[] > ([])

// ARGUMENTS on useEventSeriesListSearchFilter
const events = ref([]) // Add typescript
const documentsPerPage = 10
const totalPages = ref(0)
const currentPage = ref(1)
const route = useRoute()
const noResultsFound = ref(false)
const currentView = ref('current')

const { pastEventSeriesQuery, currentEventSeriesQuery } = useEventSeriesListSearchFilter()
const testdata = await pastEventSeriesQuery(['*'])
const testdata2 = await currentEventSeriesQuery(['*'])

// ELASTIC SEARCH FUNCTION
async function searchES() {
  let results = {}

  if (currentView.value === 'current') {
    // Current series
    const { currentEventSeriesQuery } = await useEventSeriesListSearchFilter()
    results = await currentEventSeriesQuery()
  } else {
    // Past series
    const { pastEventSeriesQuery } = await useEventSeriesListSearchFilter()
    results = await pastEventSeriesQuery()
  }

  if (results && results.hits && results.hits.total.value > 0) {
    const totalDocuments = results.hits.total.value
    events.value = results.hits.hits
    noResultsFound.value = false
    // pagination logic
    totalPages.value = Math.ceil(totalDocuments / documentsPerPage)
  } else {
    noResultsFound.value = true
    events.value = []
    // pagination logic
    totalPages.value = 0
  }
}

onMounted(() => {
  searchES()
})

const testdata3 = await searchES()

</script>

<template>
  <div class="page page-event-series">
    <div class="full-width">
      <SectionWrapper
        class="header"
        :section-title="heading.titleGeneral"
        :section-summary="heading.summary"
        theme="paleblue"
      />

      <SectionWrapper>
        <h2>TESTDATA3 - {{ testdata3 }}</h2>
      </SectionWrapper>

      <!-- <SectionWrapper theme="paleblue">
        <TabList
        alignment="center"
        :initial-tab="current">
          <TabItem
            title="Past Series"
            class="tab-content"
          >
            <template v-if="parsedEventSeries.length > 0">
              <SectionStaffArticleList :items="parsedEventSeries" />
            </template>
</TabItem>

<TabItem title="Current and Upcoming Series" class="tab-content">
  <template v-if="parsedEventSeries.length > 0">
              <SectionStaffArticleList :items="parsedEventSeries" />
            </template>
</TabItem>
</TabList>
</SectionWrapper> -->

      <!-- PAGINATION -->
      <!-- <section-pagination
        v-if="totalPages !== 1"
        class="pagination-ucla"
        :pages="totalPages"
        :initial-current-page="currentPage"
      /> -->
    </div>
  </div>
</template>

<style scoped>
@import 'assets/styles/listing-pages.scss';

.page-event-series {
  position: relative;
  background-color: var(--pale-blue);

  .header {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-content: center;
    align-items: center;
    text-align: center;

    max-width: 787px;
  }

  :deep(.tab-list .tab-list-header) {
    margin-top: -50px;
    margin-bottom: 50px;
  }
}
</style>
