<script lang="ts" setup>

import { computed, ref } from 'vue'
import { useCollectionAggregator } from '../composables/useCollectionAggregator'
import config from '~/utils/searchConfig'

const attrs = useAttrs() as { page?: { title: string, ftvaFilters: string[], ftvaHomepageDescription: string } }
const route = useRoute()

// This is creating an index of the main content(not related content)
if (attrs.page && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the collection data using the composable during static build
    await indexContent(attrs.page, route.params.slug)
    // console.log('Collection indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX COLLECTION during static build:', error)
  }
}

// "STATE"
const currentPage = ref(1)
const documentsPerPage = 15 // show 15 search results at a time
const totalPages = ref(3)
const totalResults = ref(27)
const noResultsFound = ref(false)
const isLoading = ref<boolean>(false)
const isMobile = ref(false)
const hasMore = ref(true) // Flag to control infinite scroll

// const userFilterSelection = ref<FilterItem>({ 'ftvaEventTypeFilters.title.keyword': [], 'ftvaScreeningFormatFilters.title.keyword': [] })
const collectionResults = ref([]) // Collection list?

const totalResultsDisplay = computed(() => {
  return totalResults.value + ' Video Clips'
})

const collectionTitle = ref(attrs.page.title || '')
interface AggregationBucket {
  key: string
  doc_count: number
}
interface Aggregations {
  [key: string]: { buckets: AggregationBucket[] }
}
const ftvaFilters = ref(attrs.page.ftvaFilters || [])

function parseESConfigFilters(configFilters, ftvaFiltersArg) {
  console.log('configFilters', configFilters)
  console.log('ftvaFilters', ftvaFiltersArg)
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
  const filters = (Object.entries(response) || []).map(([key, value]) => ({
    label: key,
    options: value.buckets.map(bucket => ({
      label: bucket.key,
      value: bucket.key
    }))
  }))
  return filters
}
// fetch filters for the page from ES after page loads in Onmounted hook on the client side
async function setFilters() {
  const parsedESConfigFiltersRes = parseESConfigFilters(config.collection.filters, ftvaFilters.value)

  const searchAggsResponse: Aggregations = await useCollectionAggregator(
    parsedESConfigFiltersRes,
    'ftvaItemInCollection',
    collectionTitle.value // change it what is being used on this page template
  )

  console.log('Search Aggs Response: ' + JSON.stringify(searchAggsResponse))
  // searchFilters.value is just a place holder which will have all the
  // filter data for single select drop down in [{ label}]
  searchFilters.value = parseAggRes(
    searchAggsResponse
  )
}

// ELASTIC SEARCH FUNCTION
async function searchES() {
  if (isLoading.value || !hasMore.value) return

  isLoading.value = true

  try {
    const currpage = currentPage.value
    const size = documentsPerPage
    let results: any = {}

    const { paginatedSearchFilters } = useListSearchFilter()

    console.log('about to searchES')
    results = await paginatedSearchFilters(currpage, size, 'ftvaCollection', searchFilters.value, [], 'startDate', 'asc')

    console.log('Search Results:', results)
    if (results && results.hits && results.hits.hits.length > 0) {
      const newCollectionResults = results.hits.hits || []

      collectionResults.value = newCollectionResults
      totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)

      noResultsFound.value = false
    } else {
      noResultsFound.value = true
      // if (!isMobile.value) totalPages.value = 0
      hasMore.value = false
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching data:', error)
    hasMore.value = false
  } finally {
    isLoading.value = false
  }
}

// WATCHERS
// This watcher is called when router pushes updates the query params
watch(
  () => route.query,
  (newVal, oldVal) => {
    console.log('route query watcher triggered')
    // const selectedFiltersFromRoute = parseFilters(route.query.filters || '')

    // userFilterSelection.value = { 'ftvaEventTypeFilters.title.keyword': [], 'ftvaScreeningFormatFilters.title.keyword': [], ...selectedFiltersFromRoute } // ensure all filter groups are present

    currentPage.value = route.query.page ? parseInt(route.query.page as string) : 1

    // userViewSelection.value = (route.query.view as string | undefined) || 'list'
    // console.log('route.query.dates', route?.query?.dates)

    // userDateSelection.value = parseDateFromURL(route.query.dates as string | undefined) || []

    // allFilters.value = parsedRemoveSearchFilters.value
    // console.log('userDateSelection.value', userDateSelection.value)

    // isMobile.value ? mobileEvents.value = [] : desktopEvents.value = []
    hasMore.value = true
    searchES()
  }, { deep: true, immediate: true }
)

onMounted(async () => {
  await setFilters()

  // const { allEvents } = useDateFilterQuery()

  // Logic to fetch all events

  // console.log(esOutput.hits.total.value)
  // if (esOutput.hits.total.value === 0) dateListDateFilter.value = []
  // dateListDateFilter.value = esOutput.hits.hits.map(event => event.fields.formatted_date[0])
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
  <main>
    <div class="page page-collections-list-of-items">
      <NavBreadcrumb
        data-test="breadcrumb"
        class="breadcrumb"
        :title="$attrs.page.title"
        to="/collections"
      />
      <!-- TODO scrollElem used for infinite scrolling -->
      <SectionWrapper
        ref="scrollElem"
        :section-title="$attrs.page.title"
        class="header"
        theme="paleblue"
        data-test="complex-collections-page-title"
      >
        <RichText
          v-if="$attrs.page?.ftvaHomepageDescription"
          class="description"
          :rich-text-content="$attrs.page.ftvaHomepageDescription"
        />
        <DividerWayFinder />

        <span class="search-filters">

          <div
            v-for="(filter, index) in searchFilters"
            :key="index"
          >
            <label
              v-if="filter.label"
              :for="filter.label"
              class="select-label"
            >
              {{ filter.label }}
            </label>
            <select
              :id="filter.label"
              :name="filter.label"
              class="select-input"
            >
              <option
                disabled
                value=""
              >
                -- Select an option --
              </option>
              <option
                v-for="option in filter.options"
                :key="option.key"
                :value="option.value"
              >
                {{ option.value }}
              </option>
            </select>
          </div>

          <label for="sortorder">Sort order</label>
          <select
            id="sortorder"
            name="sortorder"
          >
            <option value="oldestdate">Sort by: Date (oldest)</option>
            <option value="newestdate">Sort by: Date (newest)</option>
          </select>

          <BlockTag
            data-test="total-results"
            class="total-results"
            :label="totalResultsDisplay"
          />
        </span>
        <!-- <SectionTeaserCard /> -->
        <SectionPagination
          v-if="totalPages !== 1 && !isMobile"
          :pages="totalPages"
          :initial-current-page="currentPage"
        />
      </SectionWrapper>
    </div>
  </main>
</template>
<style lang="scss" scoped>
main {
  background-color: var(--pale-blue);
}

.page-collections-list-of-items {

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

      .total-results {
        background-color: #132941; // navyblue
        margin-left: auto; // pins the total results to the right
      }
    }

    // :deep(.section-pagination) {
    //   margin-inline: auto;
    //   padding: 2.5%;
    // }
  }
}
</style>
