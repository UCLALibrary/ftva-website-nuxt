<script lang="ts" setup>

import { computed, ref } from 'vue'
import { useCollectionAggregator } from '../composables/useCollectionAggregator'
import config from '~/utils/searchConfig'
import normalizeTitleForAlphabeticalBrowse from '~/utils/normalizeTitleForAlphabeticalBrowseBy'
import useMobileOnlyInfiniteScroll from '@/composables/useMobileOnlyInfiniteScroll'

const attrs = useAttrs() as { page?: { title: string, ftvaFilters: string[], ftvaHomepageDescription: string, titleBrowse: string, groupName: string } }

const route = useRoute()
const router = useRouter()

defineOptions({
  inheritAttrs: false
})

interface AggregationBucket {
  key: string
  doc_count: number
}

interface Aggregations {
  [key: string]: { buckets: AggregationBucket[] }
}

// This is creating an index of the main content(not related content)
if (attrs.page && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    attrs.page.titleBrowse = normalizeTitleForAlphabeticalBrowse(attrs.page.title)
    attrs.page.groupName = 'Collections'
    // Index the collection data using the composable during static build
    await indexContent(attrs.page, route.params.slug)
    // console.log('Collection indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX COLLECTION during static build:', error)
  }
}

// "STATE"
const documentsPerPage = 15 // show 15 search results at a time
const totalResults = ref(0)
const noResultsFound = ref(false)

const collectionFetchFunction = async () => {
  const { paginatedCollectionSearchFilters } = useListSearchFilter() // composable

  const currpage = currentPage.value
  const size = documentsPerPage
  let results: any = {}

  results = await paginatedCollectionSearchFilters(currpage, size, 'ftvaItemInCollection', titleForSearch.value, selectedFilters.value, selectedSortFilters.value.sortField)

  return results
}

const onResults = (results) => {
  if (results && results.hits && results?.hits?.hits?.length > 0) {
    const newCollectionResults = results.hits.hits || []
    totalResults.value = results.hits.total.value

    if (isMobile.value) {
      totalPages.value = 0
      mobileItemList.value.push(...newCollectionResults)
      hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
    } else {
      desktopItemList.value = newCollectionResults
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
const { isLoading, isMobile, hasMore, desktopItemList, mobileItemList, totalPages, currentPage, currentList, scrollElem, searchES } = useMobileOnlyInfiniteScroll(collectionFetchFunction, onResults)

// Format search results for SectionTeaserCard
const parsedCollectionResults = computed(() => {
  if (currentList.value.length === 0) return []
  return currentList.value.map((obj) => {
    const objImage = obj._source.ftvaImage.length ? obj._source.ftvaImage[0] : null
    return {
      ...obj._source,
      title: obj._source.title,
      to: `/${obj._source.uri}`,
      image: objImage,
      videoEmbed: obj._source.videoEmbed,
    }
  })
})

// Format # of results of BlockTag display
const totalResultsDisplay = computed(() => {
  return totalResults.value + ' Video Clip' + (totalResults.value > 1 ? 's' : '')
})

const collectionTitle = ref(attrs.page.title || '')

// SORT SETUP - uses static data
const sortDropdownData = {
  options: [
    { label: 'Date (oldest)', value: 'asc' },
    { label: 'Date (newest)', value: 'desc' },
  ],
  label: 'Sort by',
  fieldName: 'sortField'
}

const selectedSortFilters = ref({ sortField: 'asc' })

function updateSort(newSort) {
  router.push({
    path: route.path,
    query: {
      filters: route.query.filters,
      sort: newSort.sortField,
      page: route.query.page
    }
  })
}

// FILTERS SETUP - uses dynamic data
const ftvaFilters = ref(attrs.page.ftvaFilters || [])
function parseESConfigFilters(configFilters, ftvaFiltersArg) {
  const parsedfilters = []
  for (const ftvaFilter of ftvaFiltersArg) {
    const filter = configFilters.find(filter => filter.craftFieldValue === ftvaFilter)
    if (filter) {
      parsedfilters.push(filter)
    }
  }
  return parsedfilters
}

const searchFilters = ref([])

function parseAggRes(response: Aggregations) {
  // console.log('parseAggRes response', response)
  const filters = (Object.entries(response) || []).map(([key, value]) => ({
    label: key,
    options: value.buckets.map(bucket => ({
      label: bucket.key,
      value: bucket.key
    }))
  }))

  filters.forEach((filter) => {
    if (filter.label !== 'Filter by Season') return
    // Special case for 'Filter by Season' to sort options numerically
    filter.options.sort((a, b) => {
      return parseInt(a.value) - parseInt(b.value)
    })
  })

  filters[0].options.unshift({
    label: '(none selected)',
    value: '(none selected)'
  })

  return filters
}

// fetch filters for the page from ES after page loads in Onmounted hook on the client side
async function setFilters() {
  const parsedESConfigFiltersRes = parseESConfigFilters(config.collection.filters, ftvaFilters.value)
  const searchAggsResponse: Aggregations = await useCollectionAggregator(
    parsedESConfigFiltersRes,
    'ftvaItemInCollection',
    titleForSearch.value // change it what is being used on this page template
  )
  // searchFilters.value is just a place holder which will have all the
  // filter data for single select drop down in [{ label}]
  searchFilters.value = parseAggRes(
    searchAggsResponse
  )
}

const selectedFilters = ref({}) // initialise with empty filter
// Object w key filter label and value ESFieldName for selected filter lookup
const fieldNamefromLabel = {
  'Filter by Topic': 'ftvaCollectionGroup.title.keyword',
  'Filter by Season': 'episodeSeason.keyword'
}

function updateFilters(newFilter) {
  const newFilterValue = Object.values(newFilter)[0]
  if (newFilterValue === '(none selected)') {
    router.push({
      path: route.path,
      query: {
        sort: selectedSortFilters.value.sortField,
        // ignore page, we want to clear page # when filter is cleared
      }
    })
  } else {
    router.push({
      path: route.path,
      query: {
        filters: [fieldNamefromLabel[searchFilters.value[0].label]] + ':(' + newFilterValue + ')',
        sort: selectedSortFilters.value.sortField,
        // ignore page, we want to clear page # when filter is cleared
      }
    })
  }
}

const titleForSearch = computed(() => {
  // TODO: get the title from ES for the slug `in-the-life or la-rebellion`
  if (route.path.endsWith('filmography')) {
    return route.path.split('/').includes('la-rebellion')
      ? 'L.A. Rebellion' :
      route.path.split('/').includes('in-the-life') ? 'In the Life' : collectionTitle.value
  } else {
    return collectionTitle.value
  }
})

// WATCHERS
// This watcher is called when router pushes updates the query params
watch(
  () => route.query,
  (newVal, oldVal) => {
    isLoading.value = false
    // console.log('Route query params changed:', newVal, oldVal)
    // set filters from query params
    const selectedFiltersFromRoute = parseFilters(route.query.filters || '')
    if (Object.keys(selectedFiltersFromRoute).length === 0) {
      // if object is empty, set selectedFilters to empty object
      selectedFilters.value = {}
    } else {
      // else destructure the selectedFiltersFromRoute object and convert first value from array to string
      selectedFilters.value = { [Object.keys(selectedFiltersFromRoute)[0]]: Object.values(selectedFiltersFromRoute)[0][0] }
    }
    // set sort & page # from query params
    selectedSortFilters.value = { sortField: Array.isArray(route.query.sort) ? route.query.sort[0] : (route.query.sort || 'asc') }
    currentPage.value = route.query.page ? parseInt(route.query.page as string) : 1
    searchES()
  }, { deep: true, immediate: true }
)

onMounted(async () => {
  await setFilters()
})

useHead({
  title: attrs.page ? attrs.page.title : '... loading',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: removeTags(attrs.page.ftvaHomepageDescription)
    }
  ]
})
</script>
<template>
  <main class="blue-main">
    <div class="page page-collections-list-of-items">
      <NavBreadcrumb
        data-test="breadcrumb"
        class="breadcrumb"
        :title="attrs.page.title"
        to="/collections"
      />
      <SectionWrapper
        ref="scrollElem"
        :section-title="attrs.page.title"
        class="header"
        theme="paleblue"
        data-test="complex-collections-page-title"
      >
        <RichText
          v-if="attrs.page?.ftvaHomepageDescription"
          class="description"
          :rich-text-content="attrs.page.ftvaHomepageDescription"
        />
        <DividerWayFinder />

        <span
          v-if="!isLoading"
          class="search-filters"
        >
          <!-- Filter by -->
          <DropdownSingleSelect
            v-model:selected-filters="selectedFilters"
            :label="searchFilters[0].label"
            :options="searchFilters[0].options"
            :field-name="fieldNamefromLabel[searchFilters[0].label]"
            @update-display="(newFilter) => {
              updateFilters(newFilter)
            }"
          />
          <!-- Sort by -->
          <DropdownSingleSelect
            v-model:selected-filters="selectedSortFilters"
            :label="sortDropdownData.label"
            :options="sortDropdownData.options"
            :field-name="sortDropdownData.fieldName"
            @update-display="(newSort) => {
              updateSort(newSort)
            }"
          />
          <BlockTag
            v-if="!isLoading"
            data-test="total-results"
            class="total-results"
            :label="totalResultsDisplay"
          />
        </span>
        <template v-if="isLoading">
          <div class="loading">
            ... loading ...
          </div>
        </template>
        <template v-else-if="noResultsFound">
          <div class="no-results">
            No results found
          </div>
        </template>
        <template v-else>
          <SectionTeaserCard
            class="search-results-list"
            :items="parsedCollectionResults"
            :grid-layout="true"
          />
          <SectionPagination
            v-if="totalPages !== 1 && !isMobile"
            :pages="totalPages"
            :initial-current-page="currentPage"
          />
        </template>
      </SectionWrapper>
    </div>
  </main>
</template>
<style lang="scss" scoped>
@import '~/assets/styles/slug-pages.scss';

main.blue-main {
  background-color: var(--pale-blue);
}

.page-collections-list-of-items {

  padding-bottom: 20px; // add 20px at bottom per UX review

  label.select-label,
  label.sort-label {
    display: none;
  }

  .loading,
  .no-results {
    text-align: center;
    width: 100%;
  }

  .section-wrapper {
    .section-header {
      text-align: center;
    }

    :deep(h2.section-header.section-header2.section-title) {
      color: $heading-grey;
      text-align: center;
    }

    div.description {
      max-width: 964px;
    }

    .search-filters {
      display: flex;
      width: 100%;
      gap: 12px;
      justify-content: flex-start;
      margin-bottom: 2rem;

      // filter dropdowns
      :deep(.button-dropdown-modal-wrapper.is-expanded) {
        z-index: 5;
      }

      // results pill
      .total-results {
        background-color: #132941; // navyblue
        margin-left: auto; // pins the total results to the right
        margin-right: 26px;
        text-align: center;

        @media #{$small} {
          margin-right: 0px;
        }
      }
    }

    .search-results-list {
      margin: 0 auto;

      :deep(.card-meta) {
        min-height: 150px;
      }
    }

    :deep(.dropdown-single-select) {
      width: auto; // allow the dropdown to be as wide as the content
    }

    :deep(figure.responsive-image) {
      div.sizer {
        padding-bottom: 60% !important; //overwrite the inline styles for this page
      }
    }
  }

  .section-pagination {
    padding-top: 12px;
  }
}
</style>
