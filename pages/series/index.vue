<script setup>
// COMPONENTS
import { DividerWayFinder, SectionStaffArticleList, SectionPagination, TabItem, TabList } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'
import useEventSeriesListSearchFilter from '@/composables/useEventSeriesListSearchFilter'

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

// STATE VARIABLES - ARGUMENTS on useEventSeriesListSearchFilter
const events = ref([]) // Add typescript
const currentView = ref('current') // Tracks 'current' or 'past'
const noResultsFound = ref(false)
const documentsPerPage = 10
const totalPages = ref(0)
const currentPage = ref(1)
const route = useRoute()

// COMPOSABLE FOR QUERIES
const { currentEventSeriesQuery, pastEventSeriesQuery } = useEventSeriesListSearchFilter()

// FORMATTED COMPUTED EVENTS
const parsedEventSeries = computed(() => {
  if (!events.value || events.value.length === 0) return []

  return events.value.map((obj) => {
    return {
      ...obj._source,
      tagLabels: getEventFilterLabels(obj._source),
      to: `/${obj._source.to}`,
      description: obj._source.description,
      startDate: obj._source.startDate,
      endDate: obj._source.endDate,
      ongoing: obj._source.ongoing,
      image: obj._source.image && obj._source.image.length === 1 ? obj._source.image[0] : null, // Handle single image
    }
  })
})

// FETCH EVENTS FUNCTION
async function searchES() {
  try {
    let results
    if (currentView.value === 'past') {
      results = await pastEventSeriesQuery(['*'])
    } else {
      results = await currentEventSeriesQuery(['*'])
    }

    if (results?.hits?.total?.value > 0) {
      events.value = results.hits.hits
      noResultsFound.value = false
      totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)
    } else {
      events.value = []
      noResultsFound.value = true
    }
  } catch (err) {
    console.error('Error fetching events:', err)
    noResultsFound.value = true
  }
}

onMounted(() => searchES())
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
        <h2 v-if="noResultsFound">No events found</h2>
        <SectionStaffArticleList
          v-else
          :items="parsedEventSeries"
        />
      </SectionWrapper>

      <SectionWrapper theme="paleblue">
        <TabList
          alignment="center"
          :initial-tab="current"
        >
          <TabItem
            title="Past Series"
            class="tab-content"
          >
            <template v-if="parsedEventSeries.length > 0">
              <SectionStaffArticleList :items="parsedEventSeries" />
            </template>
          </TabItem>

          <TabItem
            title="Current and Upcoming Series"
            class="tab-content"
          >
            <template v-if="parsedEventSeries.length > 0">
              <SectionStaffArticleList :items="parsedEventSeries" />
            </template>
          </TabItem>
        </TabList>
      </SectionWrapper>

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
