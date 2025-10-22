<script setup>

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVATouringSeriesList from '../gql/queries/FTVATouringSeriesList.gql'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('touring-series-list', async () => {
  const data = await $graphql.default.request(FTVATouringSeriesList)
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entry) {
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
      titleSort: normalizeTitleForAlphabeticalBrowseBy(data.value.entry.titleGeneral),
      text: data.value.entry.summary,
      uri: '/touring-series',
      sectionHandle: data.value.entry.sectionHandle,
      groupName: 'Series',
      postDate: data.value.entry.postDate,
    }
    // Index the Touring Series data using the composable during static build
    await indexContent(doc, 'touring-series-listing')
    // console.log('Touring Series indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX TOURING SERIES listing during static build:', error)
  }
}

// DATA
const page = ref(_get(data.value, 'entry', {}))

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
})

// PAGE SUMMARY
const showPageSummary = computed(() => {
  return page.value?.summary && page.value?.displaySummary === 'yes'
})

// "STATE"
const route = useRoute()
const currentView = computed(() => route.query.view || 'past') // Tracks 'current' or 'past'
const noResultsFound = ref(false)
const documentsPerPage = 10

const seriesFetchFunction = async (page) => {
  const { pastTouringSeriesQuery, currentTouringSeriesQuery } = useTouringSeriesListSearchFilter() // Composable

  let results

  if (currentView.value === 'current') {
    results = await currentTouringSeriesQuery(
      currentPage.value,
      documentsPerPage,
    )
  } else {
    results = await pastTouringSeriesQuery(currentPage.value,
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

// PAGINATION SCROLL HANDLING
// Element reference for the scroll target
const resultsSection = ref(null)
// usePaginationScroll composable
const { scrollTo } = usePaginationScroll()

watch(() => route.query, async (newVal, oldVal) => {
  isLoading.value = false
  currentPage.value = route.query.page ? parseInt(route.query.page) : 1
  isMobile.value ? mobileItemList.value = [] : desktopItemList.value = []
  hasMore.value = true

  await searchES()
  // Restore scroll position
  // // Scroll after DOM updates
  await nextTick()
  if (!isMobile.value && route.query.page && resultsSection.value && parsedTouringSeries.value.length > 0) {
    await scrollTo(resultsSection)
  }
}, { deep: true, immediate: true })

const parseViewSelection = computed(() => {
  return currentView.value === 'current' ? 1 : 0
})

// FORMATTED COMPUTED EVENTS
const parsedTouringSeries = computed(() => {
  if (currentList.value.length === 0) return []

  return currentList.value.map((obj) => {
    return {
      ...obj._source,
      to: `/${obj._source.uri}`,
      description: obj._source.richText,
      startDate: obj._source.startDate,
      endDate: obj._source.endDate,
      ongoing: obj._source.ongoing,
      image: parseImage(obj),
      sectionHandle: obj._source.sectionHandle,
    }
  })
})

useHead({
  title: page.value ? page.value.titleGeneral : '... Loading',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: removeTags(page.value.summary)
    }
  ]
})

const pageClasses = computed(() => {
  return ['page', 'page-touring-series', 'page-bottom-spacer']
})
</script>

<template>
  <main :class="pageClasses">
    <div class="full-width">
      <SectionWrapper
        id="series-section-title"
        ref="scrollElem"
        class="header"
        :level="1"
        :section-title="page.titleGeneral"
        :section-summary="showPageSummary ? page.summary : ''"
        theme="paleblue"
      />
      <div
        ref="resultsSection"
        class="for-pagination-scroll"
      />

      <SectionWrapper theme="paleblue">
        <TabList
          alignment="center"
          :initial-tab="parseViewSelection"
        >
          <TabItem
            title="Past Series"
            class="tab-content"
            data-test="past-series-view"
          >
            <template v-if="parsedTouringSeries && parsedTouringSeries.length > 0">
              <SectionStaffArticleList
                :items="parsedTouringSeries"
                data-test="tabbed-past-content"
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
            data-test="current-series-view"
          >
            <template v-if="parsedTouringSeries && parsedTouringSeries.length > 0">
              <SectionStaffArticleList :items="parsedTouringSeries" />
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
          :fixed-page-width-mode="true"
          :fixed-page-width-num="10"
        />
      </SectionWrapper>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/listing-pages.scss';

.page-touring-series {
  position: relative;
  background-color: var(--pale-blue);

  .section-wrapper:last-of-type {
    padding-bottom: 0;
  }

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
    line-height: 1;
    margin-bottom: var(--space-l);
    @include ftva-wrapper-title;
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
    padding: 15px 2.5% 60px;
    justify-content: center;
  }

  :deep(.ftva.block-staff-article-item) {
    .meta {
      margin: 0;
    }
  }

  :deep(.ftva.section-staff-article-list) {
    .sizer {
      padding-bottom: 0 !important;
    }
  }

  :deep(.ftva.block-staff-article-item .image),
  :deep(.ftva.block-staff-article-item .molecule-no-image) {
    --image-min-width: 284px;
  }

  @media screen and (max-width: 834px) {
    :deep(.ftva.block-staff-article-item .title) {
      -webkit-line-clamp: 2;
    }
  }

  @media #{$medium} {
    :deep(.section-pagination) {
      padding: 2.5%;
    }
  }

  @media #{$small} {
    :deep(.ftva.section-staff-article-list) {
      background-color: #e7edf2;
      padding: 0 16px;

      .ftva.block-staff-article-item {
        margin-bottom: 16px;
      }

      .ftva.block-staff-article-item .image {
        --image-aspect-ratio: 16/9;
        aspect-ratio: 16/9;
        height: auto;
        margin-bottom: 0;

        .sizer {
          padding-bottom: 0 !important;
        }
      }

      .meta {
        margin: 0;
        padding: 20px;

        .title {
          font-size: 21px;
        }

        .ftva-description {
          display: none;
        }

        .ftva-date {
          font-size: 20px;
        }
      }
    }

    .pagination {
      display: none;
    }
  }
}
</style>
