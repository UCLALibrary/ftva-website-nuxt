<script setup lang="ts">
import parseFilters from '@/utils/parseFilters'
import parseImage from '@/utils/parseImage'

const route = useRoute()
const documentsPerPage = 10
const totalPages = ref<number>(0)
const currentPage = ref<number>(1)
const noResultsFound = ref<boolean>(false)
const { aggregationsQuery, paginatedSiteSearchQuery } = useSiteSearch()
const searchResults = ref([] as any)



async function searchES() {
  // console.log('searchES called')
  // console.log('userFilterSelection.value', userFilterSelection.value)
  // console.log('currentPage.value', currentPage.value)
  // console.log('documentsPerPage', documentsPerPage)
  // console.log('route.query.filters', route.query.filters)
  // console.log('route.query.q', route.query.q)

  const queryQ = Array.isArray(route.query.q) ? route.query.q[0] : (route.query.q || '');
  if (queryQ && queryQ !== '') {
    const results = await paginatedSiteSearchQuery(
      queryQ,
      currentPage.value,
      documentsPerPage,
      userFilterSelection.value,

    )
    console.log('searchResults', results)
    if (results && results.hits && results.hits.hits.length > 0) {
      searchResults.value = results.hits.hits || []


      totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)

      noResultsFound.value = false
    } else {
      noResultsFound.value = true
      // if (!isMobile.value) totalPages.value = 0
      // hasMore.value = false
    }
  } else {
    searchResults.value = []
    noResultsFound.value = true
    totalPages.value = 0
  }

}
// TYPES
interface FilterItem {
  [key: string]: string[]
}
const userFilterSelection = ref<FilterItem>({ 'ftvaEventTypeFilters.title.keyword': [], 'ftvaScreeningFormatFilters.title.keyword': [] })

// This watcher is called when router push updates the query params
watch(
  () => route.query,
  (newVal, oldVal) => {
    userFilterSelection.value = parseFilters(route.query.filters || '')
    currentPage.value = route.query.page ? parseInt(route.query.page as string) : 1
    // console.log('Site search page ES newVal, oldVal', newVal, oldVal)
    // searchGenericQuery.value.queryText = route.query.q || ''
    // console.log('Site search page ES queryText updated', searchGenericQuery.value.queryText)
    //searchGenericQuery.value.queryFilters = route.query.filters ? parseFilters(decodeURIComponent(route.query?.filters)) : {}
    searchES()
  }, { deep: true, immediate: true }
)

interface AggregationBucket {
  key: string
  doc_count: number
}

interface Aggregations {
  [key: string]: { buckets: AggregationBucket[] }
}
interface FilterResult {
  name: string; // The name of the filter group (e.g., "Event Type").
  searchField: string; // The corresponding search field in Elasticsearch.
  options: string[]; // The options available for this filter group.
}
const searchFilters = ref({} as FilterResult)

function transformEsResponseToFilterResults(aggregations: Aggregations): FilterResult {
  // Initialize the filterResults object
  const filterResults: FilterResult = { name: '', searchField: '', options: [] }

  // Iterate over the aggregations in the Elasticsearch response
  for (const [key, value] of Object.entries(aggregations)) {
    // Extract the bucket keys as options
    const options = value.buckets.map(bucket => bucket.key + '(' + bucket.doc_count + ')')

    // Add the filter group to the array

    filterResults.name = key
    filterResults.searchField = 'sectionHandle.keyword'
    filterResults.options = options
  }
  return filterResults
}



const parsedResults = computed(() => {
  if (searchResults.value.length === 0) return []
  return searchResults.value.map((obj) => {
    return {
      ...obj._source,
      // tagLabels: addHighlightState(getEventFilterLabels(obj._source)),
      to: `/${obj._source.uri}`,
      image: parseImage(obj)
    }
  })
})
// fetch filters for the page from ES after page loads in Onmounted hook on the client side
async function setFilters() {
  // const parsedESConfigFiltersRes = parseESConfigFilters(config.collection.filters, ftvaFilters.value)

  const searchAggsResponse: Aggregations = await aggregationsQuery()
  // searchFilters.value is just a place holder which will have all the
  // filter data for single select drop down in [{ label}]
  searchFilters.value = transformEsResponseToFilterResults(
    searchAggsResponse
  )
}
onMounted(async () => {
  // await setFilters()
})
</script>
<template>
  <div class="search-page">
    <div class="one-column">
      <h1>Search Page</h1>
      <p>This is the search page.</p>
      <div>
        <NavSearch />
      </div>
    </div>
    <div class="two-column">
      <div class="sidebar">
        <div class="filters">
          <div class="filter-group">
            <h3>{{ searchFilters.name }}</h3>
            <NuxtLink
              v-for="option in searchFilters.options"
              :key="option"
              :to="{ query: { ...route.query, filters: encodeURIComponent(JSON.stringify({ 'sectionHandle.keyword': option })) } }"
              class="filter-link"
            >
              {{ option }} <br />
            </NuxtLink>

          </div>
        </div>
      </div>
      <div class="content">


        <div
          v-if="noResultsFound"
          class="no-results"
        >
          <p>No results found.</p>
        </div>
        <div
          v-else
          class="results"
        >
          <p>Results will be displayed here.</p>
          <div>

            <!--div
              v-for="result in parsedResults"
              :key="result.id"
              class="result-item"
            >
              <NuxtLink :to="result.to">
                <img
                  :src="result.image"
                  alt=""
                />
                <h2>{{ result.title }}</h2>
                <p>{{ result.description }}</p>
              </NuxtLink>
            </div-->
            <SectionStaffArticleList
              :items="parsedResults"
              data-test="latest-blogs"
            />

            <SectionPagination
              v-if="totalPages !== 1"
              :pages="totalPages"
              :initial-current-page="currentPage"
            />
          </div>

        </div>


      </div>
    </div>
  </div>
</template>
<style scoped>
.search-page {
  .one-column {

    /*max-width: var(--max-width);
    margin: 0 auto;

    :deep(.nav-breadcrumb) {
      padding: 0px;
    }

    @media (max-width: 1200px) {
      .one-column {
        padding-left: var(--unit-gutter);
        padding-right: var(--unit-gutter);
      }
    }

    width: 100%;*/
    :deep(.ftva.nav-search) {
      background-color: var(--pale-blue);
      padding-bottom: 36px;
    }

    width: 100%;
    background-color: var(--pale-blue);
    margin: 0 auto;
  }

  .two-column {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    max-width: var(--ftva-container-max-width);
    position: relative;
    width: 100%;

    margin: 0 auto;
    margin-top: 60px;

    .content {
      margin-bottom: 0;
      width: 67%;
    }

    .sidebar {
      margin-bottom: 0;
      width: 33%;
      padding: 0 1rem;
    }
  }
}
</style>
