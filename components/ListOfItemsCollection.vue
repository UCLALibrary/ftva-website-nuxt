<script lang="ts" setup>

import { computed, ref } from 'vue'
import { useCollectionAggregator } from '../composables/useCollectionAggregator'
import config from '~/utils/searchConfig'
import normalizeTitleForAlphabeticalBrowse from '~/utils/normalizeTitleForAlphabeticalBrowseBy'
import useMobileOnlyInfiniteScroll from '@/composables/useMobileOnlyInfiniteScroll'

const attrs = useAttrs() as {
  page?: {
    title: string,
    ftvaFilters: string[],
    ftvaHomepageDescription: string,
    titleSort: string,
    titleBrowse: string,
    groupName: string,
    richText: string
  },
  breadcrumbs?: {
    titleLevel: number,
    updatedTitle: string
  }[]
}

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
    attrs.page.titleSort = normalizeTitleForAlphabeticalBrowse(attrs.page.title)
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

  console.log('Fetch Results: ', results)
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

const collectionTitle = ref(attrs.page.title || '')

const titleForSearch = computed(() => {
  if (route.path?.toString().endsWith('filmography') || route.path?.toString().endsWith('/filmography/')) {
    return route.path?.toString().includes('la-rebellion')
      ? 'L.A. Rebellion'
      : collectionTitle.value
  }

  if (route.path?.toString().endsWith('episodes') || route.path?.toString().endsWith('/episodes/')) {
    return route.path?.toString().includes('in-the-life')
      ? 'In the Life'
      : collectionTitle.value
  }

  return collectionTitle.value
})

// INFINITE SCROLL
const { isLoading, isMobile, hasMore, desktopItemList, mobileItemList, totalPages, currentPage, currentList, scrollElem, searchES } = useMobileOnlyInfiniteScroll(collectionFetchFunction, onResults)

// Format search results for SectionTeaserCard
const parsedCollectionResults = computed(() => {
  if (currentList.value.length === 0) return []
  return currentList.value.map((obj) => {
    const objImage = parseImage(obj)
    return {
      ...obj._source,
      title: obj._source.title,
      to: `/${obj._source.uri}`,
      image: objImage,
      videoEmbed: obj._source.videoEmbed,
      postDate: parseCardItemDate(obj._source) // Overrides SectionTeaserCard's default display of postDate key
    }
  })
})

// For ftvaItemInCollection, only show ftvaDate, episodeAirDate or releaseDate value; otherwise default to postDate
function parseCardItemDate(item) {
  if (item.sectionHandle === 'ftvaItemInCollection') {
    if (item.ftvaDate)
      return item.ftvaDate
    else if (item.episodeAirDate)
      return item.episodeAirDate
    else if (item.releaseDate)
      return item.releaseDate
  } else {
    return item.postDate
  }
}

const selectedFilters = ref({}) // initialise with empty filter

const selectedSortFilters = ref({ sortField: 'asc' })

// PAGINATION SCROLL HANDLING
// Element reference for the scroll target
const resultsSection = ref(null)

// usePaginationScroll composable
const { scrollTo } = usePaginationScroll()

watch(() => route.query, async (newVal, oldVal) => {
  isLoading.value = false
  // console.log('Route query params changed:', newVal, oldVal)
  // set filters from query params

  const selectedFiltersFromRoute = parseFilters(route.query.filters || '')

  console.log('Watched selected filters from route query: ', selectedFiltersFromRoute)

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
  await searchES()
  await nextTick()
  if (!isMobile.value && route.query.page && resultsSection.value && parsedCollectionResults.value.length > 0) {
    await scrollTo(resultsSection)
  }
}, { deep: true, immediate: true })

// Format # of results of BlockTag display
const totalResultsDisplay = computed(() => {
  return totalResults.value + ' Video Clip' + (totalResults.value > 1 ? 's' : '')
})

// SORT SETUP - uses static data
const sortDropdownData = {
  options: [
    { label: 'Date (oldest)', value: 'asc' },
    { label: 'Date (newest)', value: 'desc' },
  ],
  label: 'Sort by',
  fieldName: 'sortField'
}

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
  console.log('parseESConfigFilters configFilters: ', configFilters)
  console.log('parseESConfigFilters ftvaFiltersArg: ', ftvaFiltersArg)

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

function commaEncoder(str) {
  return str.replaceAll(',', '')
}

function parseAggRes(response: Aggregations) {
  const filters = (Object.entries(response) || []).map(([key, value]) => ({
    label: key,
    options: value.buckets.map(bucket => ({
      label: bucket.key,
      // value: bucket.key
      value: (bucket.key).replaceAll(',', '')
    }))
  }))
  console.log('parseAggRes filters: ', filters)

  filters.forEach((filter) => {
    if (filter?.label !== 'Filter by Season') return
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
  // if searchAggsResponse is empty, set searchFilters to empty array
  if (!searchAggsResponse) {
    searchFilters.value = []
    return
  }
  // searchFilters.value is just a place holder which will have all the
  // filter data for single select drop down in [{ label}]
  searchFilters.value = parseAggRes(
    searchAggsResponse
  )
  console.log('setFilters SearchFilters: ', searchFilters.value)
}

// Object w key filter label and value ESFieldName for selected filter lookup
const fieldNamefromLabel = {
  'Filter by Topic': 'ftvaCollectionGroup.title.keyword',
  'Filter by Season': 'episodeSeason.keyword'
}

function updateFilters(newFilter) {
  console.log('updateFilters newFilter: ', newFilter)
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
        filters: [fieldNamefromLabel[searchFilters.value[0]?.label]] + ':(' + newFilterValue + ')',
        sort: selectedSortFilters.value.sortField,
        // ignore page, we want to clear page # when filter is cleared
      }
    })
    console.log('updateFilters filters: ', [fieldNamefromLabel[searchFilters.value[0]?.label]] + ':(' + newFilterValue + ')')
  }
}

// Use either richText field or ftvaHomepageDescription field for page description
const parsedPageDescription = computed(() => {
  return attrs.page.richText ? attrs.page.richText : attrs.page.ftvaHomepageDescription ? attrs.page.ftvaHomepageDescription : ''
})

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

const pageClasses = computed(() => {
  return ['page', 'page-collections-list-of-items', 'page-bottom-spacer']
})
</script>

<template>
  <main
    id="main"
    :class="pageClasses"
  >
    <div class="one-column">
      <NavBreadcrumb
        data-test="breadcrumb"
        class="breadcrumb"
        :title="attrs.page.title"
        :override-title-group="attrs.breadcrumbs"
        to="/collections"
      />
      <SectionWrapper
        id="collection-items-section-title"
        ref="scrollElem"
        :level="1"
        :section-title="attrs.page.title"
        theme="paleblue"
        data-test="complex-collections-page-title"
      >
        <RichText
          v-if="parsedPageDescription"
          class="description"
          :rich-text-content="parsedPageDescription"
        />
        <DividerWayFinder />
        <div
          ref="resultsSection"
          class="for-pagination-scroll"
        />

        <span
          v-if="!isLoading"
          class="search-filters"
        >
          <!-- Filter by -->
          <DropdownSingleSelect
            v-if="searchFilters.length > 0"
            v-model:selected-filters="selectedFilters"
            :label="searchFilters[0]?.label"
            :options="searchFilters[0]?.options"
            :field-name="fieldNamefromLabel[searchFilters[0]?.label]"
            @update-display="(newFilter) => {
              updateFilters(newFilter)
            }"
          />
          <!-- Sort by -->
          <DropdownSingleSelect
            v-model:selected-filters="selectedSortFilters"
            :label="sortDropdownData?.label"
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
            :fixed-page-width-mode="true"
            :fixed-page-width-num="10"
          />
        </template>
      </SectionWrapper>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/listing-pages.scss';

.page-collections-list-of-items {
  background-color: var(--pale-blue);

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
    padding-inline: 0;
    padding-bottom: 0;

    .section-header {
      text-align: center;
    }

    :deep(h1.section-header.section-header1.section-title) {
      @include ftva-wrapper-title;
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
        background-color: var(--dark-navy);
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
    padding: 45px 2.5% 0;
    justify-content: center;
  }
}
</style>
