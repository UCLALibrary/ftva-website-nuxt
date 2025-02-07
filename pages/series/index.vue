<script setup>
// COMPONENTS
import { DividerWayFinder, SectionStaffArticleList, SectionPagination, TabItem, TabList } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'
import { useWindowSize, useInfiniteScroll } from '@vueuse/core'

// GQL - start
import FTVAEventSeriesList from '../gql/queries/FTVAEventSeriesList.gql'

// UTILS
import parseImage from '@/utils/parseImage'
import removeTags from '~/utils/removeTags'

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
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

// METADATA INFO
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    const doc = {
      title: data.value.entry.titleGeneral,
      text: data.value.entry.summary,
      uri: '/series'
    }
    // Index the event series data using the composable during static build
    await indexContent(doc, 'series-listing')
    // console.log('Event series indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX EVENT SERIES listing during static build:', error)
  }
}

const heading = ref(_get(data.value, 'entry', {}))

useHead({
  title: heading.value ? heading.value.titleGeneral : '... Loading',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: removeTags(heading.value.summary)
    }
  ]
})

// PREVIEW WATCHER
watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  heading.value = _get(newVal, 'entry', {})
})
// GQL - End

// STATE MANAGEMENT
const desktopPage = useState('desktopPage', () => 1) // Persist desktop page
const desktopSeries = ref([]) // Desktop series list
const mobileSeries = ref([]) // Mobile series list
const series = computed(() => (isMobile.value ? mobileSeries.value : desktopSeries.value))
const currentView = computed(() => route.query.view || 'current') // Tracks 'current' or 'past'
const noResultsFound = ref(false)
const documentsPerPage = 10
const totalPages = ref(0)
const currentPage = ref(1)
const route = useRoute()

// INFINITE SCROLLING
const isLoading = ref(false)
const isMobile = ref(false)
const hasMore = ref(true) // Flag to control infinite scroll
const scrollEl = ref(null)

// const desktopEl = ref(null)
const scrollAll = useInfiniteScroll(
  scrollEl,
  async () => {
    if (isMobile.value && hasMore.value && !isLoading.value) {
      currentPage.value++
      await searchES()
    }
  },
  { distance: 100 }
)

// WINDOW SIZE HANDLING
const { width } = useWindowSize()
watch(width, (newWidth) => {
  const wasMobile = isMobile.value
  isMobile.value = newWidth <= 750
  // Reinitialize only when transitioning between mobile and desktop
  if (wasMobile !== isMobile.value) {
    handleScreenTransition()
  }
}, { immediate: true })

// HANDLE SCREEN TRANSITIONS
function handleScreenTransition() {
  if (isMobile.value) {
    // Switching to mobile: save desktop page, clear query param

    desktopPage.value = currentPage.value
    currentPage.value = 1
    mobileSeries.value = []
    hasMore.value = true
    const { page, ...remainingQuery } = route.query
    useRouter().push({ query: { ...remainingQuery, view: currentView.value } })
  } else {
    // Switching to desktop: restore query param
    if (totalPages.value === 1)
      desktopPage.value = 1
    const restoredPage = desktopPage.value || 1
    useRouter().push({ query: { ...route.query, page: restoredPage.toString(), view: currentView.value } })
    currentPage.value = restoredPage
    desktopSeries.value = []
  }
}

// FORMATTED COMPUTED EVENTS
const parsedEventSeries = computed(() => {
  if (series.value.length === 0) return []

  return series.value.map((obj) => {
    return {
      ...obj._source,
      to: `/${obj._source.uri}`,
      description: obj._source.eventDescription,
      startDate: obj._source.startDate,
      endDate: obj._source.endDate,
      ongoing: obj._source.ongoing,
      image: parseImage(obj)
    }
  })
})

// ES FUNCTION
async function searchES() {
  if (isLoading.value || !hasMore.value) return

  isLoading.value = true
  // COMPOSABLE
  const { currentEventSeriesQueryCurrent, currentEventSeriesQueryOngoing, pastEventSeriesQuery } = useEventSeriesListSearchFilter()

  try {
    let results

    if (currentView.value === 'current') {
      const [currentSeriesResult, ongoingSeriesResult] = await Promise.all([
        currentEventSeriesQueryCurrent(
          currentPage.value,
          documentsPerPage,
          'startDate',
          'asc',
          ['*']
        ),
        currentEventSeriesQueryOngoing(
          currentPage.value,
          documentsPerPage,
          'startDate',
          'asc',
          ['*']
        )
      ])

      // Combine results with current series first, ongoing series last
      const currentSeries = currentSeriesResult?.hits?.hits || []
      const ongoingSeries = ongoingSeriesResult?.hits?.hits || []
      results = {
        hits: {
          hits: [...currentSeries, ...ongoingSeries],
          total: { value: currentSeries.length + ongoingSeries.length },
        },
      }
    } else {
      results = await pastEventSeriesQuery(currentPage.value,
        documentsPerPage,
        'startDate',
        'desc',
        ['*'])
    }

    if (results?.hits?.hits?.length > 0) {
      const newSeries = results.hits.hits || []
      if (isMobile.value) {
        totalPages.value = 0
        mobileSeries.value.push(...newSeries)
        hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
      } else {
        desktopSeries.value = newSeries
        totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)
      }
      noResultsFound.value = false
    } else {
      noResultsFound.value = true
      totalPages.value = 0
      hasMore.value = false
    }
  } catch (err) {
    noResultsFound.value = true
  } finally {
    isLoading.value = false
  }
}

const parseViewSelection = computed(() => {
  return currentView.value === 'current' ? 1 : 0
})

watch(() => route.query,
  (newVal, oldVal) => {
    isLoading.value = false
    currentPage.value = route.query.page ? parseInt(route.query.page) : 1
    isMobile.value ? mobileSeries.value = [] : desktopSeries.value = []
    hasMore.value = true
    searchES()
  }, { deep: true, immediate: true }
)
</script>

<template>
  <div class="page page-event-series">
    <div class="full-width">
      <SectionWrapper
        ref="scrollEl"
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

        <SectionPagination
          v-if="
            totalPages
            !== 1 && !isMobile"
          class="pagination"
          :pages="totalPages"
          :initial-current-page="currentPage"
        />
      </SectionWrapper>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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

  :deep(.section-pagination) {
    /* TODO Move this to ftva sectionwrapper.theme.paleblue scss file */
    background-color: white;
    max-width: unset;
    padding: 2.5%;
  }

  @media #{$small} {
    .pagination {
      display: none;
    }
  }
}
</style>
