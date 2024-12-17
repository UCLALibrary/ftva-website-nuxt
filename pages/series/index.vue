<script setup>
// COMPONENTS
import { DividerWayFinder, SectionStaffArticleList, SectionPagination, TabItem, TabList } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'
import FTVAEventSeriesList from '../gql/queries/FTVAEventSeriesList.gql'
import useEventSeriesListSearchFilter from '@/composables/useEventSeriesListSearchFilter'

// GQL - start

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

// Helper functions copied from event index
// Get data for Image
function parsedImage(obj) {
  return obj._source.imageCarousel
}

function isImageExists(obj) {
  return !!(parsedImage(obj) && parsedImage(obj).length === 1 && parsedImage(obj)[0]?.image && parsedImage(obj)[0]?.image?.length === 1)
}

// FORMATTED COMPUTED EVENTS
const parsedEventSeries = computed(() => {
  console.log(events.value)
  if (events.value.length === 0) return []

  return events.value.map((obj) => {
    return {
      ...obj._source,
      to: `/${obj._source.uri}`,
      description: obj._source.eventDescription,
      startDate: obj._source.startDate,
      endDate: obj._source.endDate,
      ongoing: obj._source.ongoing,
      image: isImageExists(obj) ? parsedImage(obj)[0]?.image[0] : null
    }
  })
})
// ES FUNCTION
async function searchES() {
  try {
    let results
    if (currentView.value === 'current') {
      results = await currentEventSeriesQuery(currentPage.value,
        documentsPerPage.value,
        'startDate',
        'asc',
        ['*'],)
    } else {
      results = await pastEventSeriesQuery(currentPage.value,
        documentsPerPage.value,
        'startDate',
        'desc',
        ['*'])
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

const parseViewSelection = computed(() => {
  return currentView.value === 'current' ? 1 : 0
})

watch(
  () => route.query,
  (newVal, oldVal) => {
    currentView.value = route.query.view || 'current'
    searchES()
  }, { deep: true, immediate: true }
)
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

      <SectionWrapper theme="paleblue">
        <TabList
          alignment="center"
          :initial-tab="parseViewSelection"
        >
          <TabItem
            title="Past Series"
            class="tab-content"
          >
            <template v-if="parsedEventSeries && parsedEventSeries.length > 0">
              <SectionStaffArticleList :items="parsedEventSeries" />

              <section-pagination
                v-if="totalPages !== 1"
                :pages="totalPages"
                :initial-current-page="currentPage"
              />
            </template>

            <template v-else>
              <p
                v-if="noResultsFound"
                class="empty-tab"
              >
                There are no past event series
              </p>
              <p
                v-else
                class="empty-tab"
              >
                Data loading in progress ...
              </p>
            </template>
          </TabItem>

          <TabItem
            title="Current and Upcoming Series"
            class="tab-content"
          >
            <template v-if="parsedEventSeries && parsedEventSeries.length > 0">
              <SectionStaffArticleList :items="parsedEventSeries" />

              <section-pagination
                v-if="totalPages !== 1"
                :pages="totalPages"
                :initial-current-page="currentPage"
              />
            </template>

            <template v-else>
              <p
                v-if="noResultsFound"
                class="empty-tab"
              >
                There are no current or upcoming event series
              </p>
              <p
                v-else
                class="empty-tab"
              >
                Data loading in progress ...
              </p>
            </template>
          </TabItem>
        </TabList>
      </SectionWrapper>
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

  .empty-tab {
    background-color: var(--pale-blue);
    @include ftva-subtitle-1;
    color: var(--subtitle-grey);
    padding: 100px 0;
    text-align: center;
  }
}
</style>
