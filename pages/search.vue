<script setup lang="ts">
import SvgGlyphX from 'ucla-library-design-tokens/assets/svgs/icon-ftva-xtag.svg'
import parseFilters from '@/utils/parseFilters'
import parseImage from '@/utils/parseImage'

// SVG

const route = useRoute()
const documentsPerPage = 10
const totalPages = ref<number>(0)
const currentPage = ref<number>(1)
const noResultsFound = ref<boolean>(false)
const { paginatedSiteSearchQuery } = useSiteSearch()
const searchResults = ref([] as any)

interface AggregationBucket {
  key: string
  doc_count: number
}

interface Aggregations {
  [key: string]: { buckets: AggregationBucket[] }
}
interface Option {
  queryOption: string
  label: string
  highlighted?: boolean // Optional class for styling, e.g., 'highlightFilter'
  count?: number // Optional count for the filter group, if needed.
}

interface FilterResult {
  name: string // The name of the filter group (e.g., "Event Type").
  searchField: string // The corresponding search field in Elasticsearch.
  options: Option[] // The options available for this filter group.

}
const searchFilters = ref<FilterResult>({
  name: 'groupName.keyword',
  searchField: 'groupName.keyword',
  options: [
    { queryOption: 'Collections', label: 'Collections (0)', highlighted: false, count: 0 },
    { queryOption: 'Articles', label: 'Articles (0)', highlighted: false, count: 0 },
    { queryOption: 'Events', label: 'Events (0)', highlighted: false, count: 0 },
    { queryOption: 'Series', label: 'Series (0)', highlighted: false, count: 0 },
    { queryOption: 'General Content', label: 'General Content (0)', highlighted: false, count: 0 }
  ]
})

async function searchES() {
  // console.log('searchES called')
  // console.log('userFilterSelection.value', userFilterSelection.value)
  // console.log('currentPage.value', currentPage.value)
  // console.log('documentsPerPage', documentsPerPage)
  // console.log('route.query.filters', route.query.filters)
  // console.log('route.query.q', route.query.q)

  const queryQ = Array.isArray(route.query.q) ? route.query.q[0] : (route.query.q || '')
  if (queryQ && queryQ !== '') {
    const results = await paginatedSiteSearchQuery(
      queryQ,
      currentPage.value,
      documentsPerPage,
      userFilterSelection.value,
      sortField.value,
      orderBy.value,
    )
    console.log('searchResults', results)
    if (results && results.hits && results.hits.hits.length > 0) {
      searchResults.value = results.hits.hits || []
      // searchFilters.value =
      addHighlightStateAndCountToFilters(results.aggregations || {})
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
const userFilterSelection = ref<FilterItem>({})
const selectedSortFilters = ref({})
const sortField = ref('title.keyword') // default sort field
const orderBy = ref('asc') // default order by
// SORT SETUP - uses static data
const sortDropdownData = {
  options: [
    { label: 'Title (A-Z)', value: 'title asc', sortBy: 'title.keyword', orderBy: 'asc' },
    { label: 'Title (Z-A)', value: 'title desc', sortBy: 'title.keyword', orderBy: 'desc' },
    { label: 'Date (oldest)', value: 'date asc', sortBy: 'postDate', orderBy: 'asc' }, // TODO ask @axa which craft date field to use here
    { label: 'Date (newest)', value: 'date desc', sortBy: 'postDate', orderBy: 'desc' }, // TODO ask @axa which craft date field to use here
  ],
  label: 'Sort by',
  fieldName: 'sortField'
}
// This watcher is called when router push updates the query params
watch(
  () => route.query,
  (newVal, oldVal) => {
    userFilterSelection.value = parseFilters(route.query.filters || '')
    console.log('userFilterSelection updated', userFilterSelection.value)
    currentPage.value = route.query.page ? parseInt(route.query.page as string) : 1
    // set sort & page # from query params
    selectedSortFilters.value = { sortField: Array.isArray(route.query.sort) ? route.query.sort[0] : (route.query.sort || 'title asc') }
    sortField.value = sortDropdownData.options.find(obj => obj.value === selectedSortFilters.value)?.sortBy // Extract the field name
    orderBy.value = sortDropdownData.options.find(obj => obj.value === selectedSortFilters.value)?.orderBy // Extract the order by
    // console.log('Site search page ES newVal, oldVal', newVal, oldVal)
    // searchGenericQuery.value.queryText = route.query.q || ''
    // console.log('Site search page ES queryText updated', searchGenericQuery.value.queryText)
    // searchGenericQuery.value.queryFilters = route.query.filters ? parseFilters(decodeURIComponent(route.query?.filters)) : {}
    searchES()
  }, { deep: true, immediate: true }
)

function addHighlightStateAndCountToFilters(aggregations: Aggregations) { // : FilterResult
  console.log('addHighlightState called with aggregations:', Object.entries(aggregations))
  const updateFilters: Option[] = []
  for (const [key, value] of Object.entries(aggregations)) {
    console.log('userFilterSelection', userFilterSelection.value[key])
    if (userFilterSelection.value[key] === undefined) {
      // If the userFilterSelection does not have this key, skip it
      console.log('Skipping key:', key, 'as it is not in userFilterSelection')
      if (Array.isArray(searchFilters.value?.options)) {
        for (const option of searchFilters.value?.options) {
          const bucket = value.buckets.find(bucket => bucket.key === option.queryOption)
          if (bucket) {
            option.count = bucket.doc_count // Update the count
            option.label = bucket.key + ' (' + bucket.doc_count + ')' // Update the label with the count
          }
        }
      }
    } else {
      console.log('Processing key:', key, 'with value:', value)
      for (const item of userFilterSelection.value[key] || []) {
        // Check if the item exists in the buckets
        const bucket = value.buckets.find(bucket => bucket.key === item)
        console.log('Checking bucket:', bucket, 'for item:', item)
        if (bucket) {
          // If it exists, add a highlight state
          updateFilters.push({
            queryOption: bucket.key,
            count: bucket.doc_count,
            label: bucket.key + ' (' + bucket.doc_count + ')'
          })
        }
      }
      for (const item of updateFilters) {
        // Add the highlight state to the searchFilters
        const existingOption = searchFilters.value.options.find(option => option.queryOption === item.queryOption)
        if (existingOption) {
          existingOption.label = item.label // Update the label with the highlight state
          existingOption.highlighted = true // Add a highlighted property
        }
      }
    }
  }
  console.log('Updated searchFilters:', JSON.stringify(searchFilters.value))
}

const parsedResults = computed(() => {
  if (searchResults.value.length === 0) return []
  return searchResults.value.map((obj) => {
    return {
      ...obj._source,
      to: `/${obj._source.uri}`,
      image: parseImage(obj)
    }
  })
})

const router = useRouter()
function updateSort(newSort) {
  console.log('updateSort called with newSort:', newSort)
  router.push({
    path: route.path,
    query: {
      filters: route.query.filters,
      sort: newSort.sortField,
      page: route.query.page
    }
  })
}

function omitPageParam(query: Record<string, any>) {
  const { page, ...rest } = query
  return rest
}
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
            <h3>Filter Results</h3>
            <template
              v-for="option in searchFilters.options"
              :key="option.queryOption"
            >
              <NuxtLink
                v-if="option.count > 0"
                class=""
                :to="{ query: { ...omitPageParam(route.query), filters: `groupName.keyword:(${option.queryOption})` } }"
              >
                <!-- BlockTag component for display -->
                <BlockTag
                  :label="option.label"
                  :is-secondary="!option.highlighted"
                  :is-primary="option.highlighted"
                >
                  <!-- 'x' SVG only shows when selected -->
                  <template v-if="option.highlighted">
                    <SvgGlyphX class="close-icon" />
                  </template>
                </BlockTag>
              </NuxtLink>
              <BlockTag
                v-else
                :label="option.label"
                :is-secondary="!option.highlighted"
                :is-primary="option.highlighted"
              />
            </template>
          </div>
        </div>
      </div>
      <div class="content">
        <div
          v-if="noResultsFound && searchResults.length === 0"
          class="no-results"
        >
          <p>No results found.</p>
        </div>
        <div
          v-else
          class="results"
        >
          <p>Results will be displayed here.</p>
          <div v-if="parsedResults.length > 0">
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
:deep(.button-dropdown-modal-wrapper.is-expanded) {
  z-index: 1000;
}

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
