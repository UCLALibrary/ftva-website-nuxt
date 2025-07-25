<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAEventSeriesList from '../gql/queries/FTVAEventSeriesList.gql'

import useMobileOnlyInfiniteScroll from '@/composables/useMobileOnlyInfiniteScroll'

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
      uri: '/series',
      sectionHandle: data.value.entry.sectionHandle,
      groupName: 'Series',
      postDate: data.value.entry.postDate,
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

// "STATE"
const route = useRoute()
const currentView = computed(() => route.query.view || 'current') // Tracks 'current' or 'past'
const noResultsFound = ref(false)
const documentsPerPage = 10

const seriesFetchFunction = async (page) => {
  const { currentEventSeriesQueryCurrent, currentEventSeriesQueryOngoing, pastEventSeriesQuery } = useEventSeriesListSearchFilter() // Composable

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

  return results
}

const onResults = (results) => {
  if (results?.hits?.hits?.length > 0) {
    const newSeries = results.hits.hits || []

    if (isMobile.value) {
      totalPages.value = 0
      mobileItemList.value.push(...newSeries)
      hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
    } else {
      desktopItemList.value = newSeries
      totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)
    }
    noResultsFound.value = false
  } else {
    noResultsFound.value = true
    totalPages.value = 0
    hasMore.value = false
  }
}

// INFINITE SCROLL
const { isLoading, isMobile, hasMore, desktopItemList, mobileItemList, totalPages, currentPage, currentList, scrollElem, searchES } = useMobileOnlyInfiniteScroll(seriesFetchFunction, onResults)

watch(() => route.query,
  (newVal, oldVal) => {
    isLoading.value = false
    currentPage.value = route.query.page ? parseInt(route.query.page) : 1
    isMobile.value ? mobileItemList.value = [] : desktopItemList.value = []
    hasMore.value = true

    searchES()
  }, { deep: true, immediate: true }
)

const parseViewSelection = computed(() => {
  return currentView.value === 'current' ? 1 : 0
})

// FORMATTED COMPUTED EVENTS
const parsedEventSeries = computed(() => {
  if (currentList.value.length === 0) return []

  return currentList.value.map((obj) => {
    return {
      ...obj._source,
      to: `/${obj._source.uri}`,
      description: obj._source.eventDescription,
      startDate: obj._source.startDate,
      endDate: obj._source.endDate,
      ongoing: obj._source.ongoing,
      image: parseImage(obj),
      sectionHandle: obj._source.sectionHandle,
    }
  })
})
</script>

<template>
  <main class="page page-event-series">
    <div class="full-width">
      <SectionWrapper
        ref="scrollElem"
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
            totalPages !== 1 && !isMobile"
          class="pagination"
          :pages="totalPages"
          :initial-current-page="currentPage"
        />
      </SectionWrapper>
    </div>
  </main>
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
    padding-bottom: var(--space-xl);
  }

  .header :deep(.section-title) {
    color: $heading-grey;
    line-height: 1;
    margin-bottom: var(--space-l);
  }

  :deep(.section-wrapper:has(.tab-list)) {
    padding-top: 0;
  }

  :deep(.tab-list .tab-list-header) {
    margin-bottom: var(--space-s);
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

  @media #{$medium} {

    :deep(.block-staff-article-item .image),
    :deep(.block-staff-article-item .image .media) {
      aspect-ratio: 1.69/1;
      height: auto;
      margin-bottom: 0;
    }

    :deep(.block-staff-article-item .meta) {
      padding: 20px;
      height: auto;

      .title {
        font-size: 26px;
      }

      .date {
        position: initial;
      }
    }

    :deep(.block-staff-article-item .responsive-image .sizer) {
      padding-bottom: 0 !important;
    }
  }

  @media #{$small} {
    .pagination {
      display: none;
    }
  }
}
</style>
