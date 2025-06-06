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
const searchFilters = ref<FilterResult>(resetSearchFilters())

function resetSearchFilters(): FilterResult {
  return {
    name: 'groupName.keyword',
    searchField: 'groupName.keyword',
    options: [
      { queryOption: 'Collections', label: 'Collections (0)', highlighted: false, count: 0 },
      { queryOption: 'Articles', label: 'Articles (0)', highlighted: false, count: 0 },
      { queryOption: 'Events', label: 'Events (0)', highlighted: false, count: 0 },
      { queryOption: 'Series', label: 'Series (0)', highlighted: false, count: 0 },
      { queryOption: 'General Content', label: 'General Content (0)', highlighted: false, count: 0 }
    ]
  }
}
async function searchES() {
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
    // console.log('searchResults', results)
    if (results && results.hits && results.hits.hits.length > 0) {
      // console.log('Search results found:', results.hits.hits.length)
      searchResults.value = results.hits.hits || []
      searchFilters.value = addHighlightStateAndCountToFilters(results.aggregations || {})
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
    searchFilters.value = resetSearchFilters()
    // console.log('No query provided, resetting search results and filters')
  }
}
// TYPES
interface FilterItem {
  [key: string]: string[]
}
const userFilterSelection = ref<FilterItem>({})
const selectedSortFilters = ref({})
const sortField = ref('_score') // default sort field
const orderBy = ref('desc') // default order by
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
    // console.log('userFilterSelection updated', userFilterSelection.value)
    currentPage.value = route.query.page ? parseInt(route.query.page as string) : 1
    // set sort & page # from query params
    selectedSortFilters.value = { sortField: Array.isArray(route.query.sort) ? route.query.sort[0] : (route.query.sort || '') }
    // console.log('selectedSortFilters updated', selectedSortFilters.value)
    if (selectedSortFilters.value.sortField === '') {
      sortField.value = '_score'
      // console.log('sortField updated', sortField.value)
      orderBy.value = 'desc'
      // console.log('orderBy updated', orderBy.value)
    } else {
      sortField.value = sortDropdownData.options.find(obj => obj.value === selectedSortFilters.value.sortField)?.sortBy // Extract the field name
      // console.log('sortField updated', sortField.value)
      orderBy.value = sortDropdownData.options.find(obj => obj.value === selectedSortFilters.value.sortField)?.orderBy // Extract the order by
      // console.log('orderBy updated', orderBy.value)
    }

    searchES()
  }, { deep: true, immediate: true }
)

function addHighlightStateAndCountToFilters(aggregations: Aggregations): FilterResult {
  let updatedOptions: Option[] = []

  const currentFilterField = searchFilters.value.searchField
  const selectedFilters = userFilterSelection.value[currentFilterField] || []
  // console.log('selectedFilters', selectedFilters, userFilterSelection.value)
  const filters = {
    name: currentFilterField,
    searchField: currentFilterField,
    options: updatedOptions,
  }
  // Iterate over the aggregations in the Elasticsearch response
  for (const [key, value] of Object.entries(aggregations)) {
    // Extract the bucket keys as options
    updatedOptions = value.buckets.map((bucket) => {
      return {
        count: bucket.doc_count, // Count of documents in this bucket
        queryOption: bucket.key,
        label: bucket.key + ` (${bucket.doc_count})`, // no count initally, will be updated later
        highlighted: selectedFilters.includes(bucket.key) // Initially set to false, will be updated later if needed
      }
    })
  }
  for (const item of resetSearchFilters().options) {
    const existingOption = updatedOptions.find(opt => opt.queryOption === item.queryOption)
    if (!existingOption) {
      updatedOptions.push(item) // Add the initial options if they don't exist in the aggregations
    }
  }

  filters.options = updatedOptions
  return filters
}

const parsedResults = computed(() => {
  // console.log('searchResults.value', searchResults.value)

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
      q: route.query.q,
      filters: route.query.filters,
      sort: newSort.sortField,
      page: route.query.page
    }
  })
}

function omitParam(query: any, option: Option) {
  // Clone the current query object
  const { page, filters, ...rest } = query

  if (option.highlighted) {
    // If highlighted, remove both page and filters
    return { ...rest }
  } else {
    // If not highlighted, remove page, and set filters to groupName.keyword:(option.queryOption)
    return {
      ...rest,
      filters: `groupName.keyword:(${option.queryOption})`
    }
  }
}

</script>
<template>
  <main class="page page-detail page-detail--paleblue search-page">
    <SectionWrapper
      ref="scrollElem"
      theme="paleblue"
    >
      <NavBreadcrumb
        class="breadcrumb"
        data-test="breadcrumb"
        title="Search Results"
        to="/"
        parent-title="Home"
      />
      <h1>Search Page</h1>
      <p>This is the search page.</p>
      <div>
        <NavSearch />
      </div>
    </SectionWrapper>
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

            <div
              v-for="option in searchFilters.options"
              :key="option.queryOption"
            >
              <NuxtLink
                v-show="option.count > 0"
                class=""
                :to="{ query: { ...omitParam(route.query, option) } }"
              >
                <BlockTag
                  :label="option.label"
                  :is-secondary="!option.highlighted"
                  :is-primary="option.highlighted"
                >
                  <template v-if="option.highlighted">
                    x
                  </template>
                </BlockTag>
              </NuxtLink>

              <BlockTag
                v-show="option.count === 0"
                :label="option.label"
                :is-secondary="!option.highlighted"
                :is-primary="option.highlighted"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="content">
        <div
          v-if="noResultsFound && parsedResults.length === 0"
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
  </main>
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



    /*margin: 0 auto;*/
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

@import 'assets/styles/slug-pages.scss';
</style>
