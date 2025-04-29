<script lang="ts" setup>

import { computed, ref } from 'vue'
import { useCollectionAggregator } from '../composables/useCollectionAggregator'
import config from '~/utils/searchConfig'

const attrs = useAttrs() as { page?: { title: string, ftvaFilters: string[], ftvaHomepageDescription: string } }
const route = useRoute()

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
const totalResults = ref(0)
const noResultsFound = ref(false)
const isLoading = ref<boolean>(false)
const isMobile = ref(false)
const hasMore = ref(true) // Flag to control infinite scroll

const userFilterSelection = ref({}) // intialise with empty filter
const userSortSelection = ref('asc')

const collectionResults = ref([])
// format search results for SectionTeaserCard
const parsedCollectionResults = computed(() => {
  if (collectionResults.value.length === 0) return []
  return collectionResults.value.map((obj) => {
    const objImage = obj._source.ftvaImage.length ? obj._source.ftvaImage[0] : null
    return {
      // ...obj._source,
      title: obj._source.title,
      to: `/${obj._source.uri}`,
      image: objImage,
      videoEmbed: obj._source.videoEmbed,
      // date: new Date(obj._source.ftvaDate), // "ftvaDate": "July 10, 1974" // TODO FORMAT
    }
  })
})

// format # of results of BlockTag display
const totalResultsDisplay = computed(() => {
  return totalResults.value + ' Video Clips'
})

const collectionTitle = ref(attrs.page.title || '')
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
  console.log('parseAggRes', response)
  const filters = (Object.entries(response) || []).map(([key, value]) => ({
    label: key,
    options: value.buckets.map(bucket => ({
      label: key + ': ' + bucket.key, // append label to front of the filter display
      value: bucket.key
    }))
  }))
  // append 'none selected' option to filters
  filters[0].options.unshift({
    label: filters[0].label + ': (none selected)',
    value: '' // TODO make this all options with OR inbetween?
  })
  console.log('filters', filters)
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

// Object w key filter label and value ESFieldName for selected filter lookup
const fieldNamefromLabel = {
  'Filter by Topic': 'ftvaCollectionGroup.title.keyword',
  'Filter by Season': 'episodeSeason.keyword'
}

// ELASTIC SEARCH FUNCTION
async function searchES() {
  if (isLoading.value || !hasMore.value) return

  isLoading.value = true

  try {
    const currpage = currentPage.value
    const size = documentsPerPage
    let results: any = {}

    const { paginatedCollectionSearchFilters } = useListSearchFilter()

    // console.log('about to searchES')
    // console.log('title', collectionTitle.value)
    // console.log('userFilterSelection.value', userFilterSelection.value)
    results = await paginatedCollectionSearchFilters(currpage, size, 'ftvaItemInCollection', collectionTitle.value, userFilterSelection.value, 'ftvaSortDate', 'asc')

    console.log('Search Results:', results)
    if (results && results.hits && results.hits.hits.length > 0) {
      const newCollectionResults = results.hits.hits || []

      collectionResults.value = newCollectionResults
      totalResults.value = results.hits.hits.length
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
    const selectedFiltersFromRoute = parseFilters(route.query.filters || '')
    console.log(selectedFiltersFromRoute, 'selectedFiltersFromRoute')
    userFilterSelection.value = { ...selectedFiltersFromRoute }
    currentPage.value = route.query.page ? parseInt(route.query.page as string) : 1
    // hasMore.value = true
    // from tinus PR
    // const filterLetter = route.query.filters
    // // filterLetter is general wildcard ('*') or lettered (ex: 'A*')
    // if (filterLetter.length === 2) {
    //   selectedLetterProp.value = filterLetter.replace('*', '')
    // } else {
    //   selectedLetterProp.value = 'All'
    // }
    // extraSearchFilter.value = filterLetter
    searchES()
  }, { deep: true, immediate: true }
)

onMounted(async () => {
  await setFilters()
  // initial selected filter
  console.log('searchFilters.value', searchFilters.value)
  // [fieldNamefromLabel[filter.label]]
  // TODO FIX THIS LOGIC TO GET THE ACTUAL FILTER from route? right now it is hardcoded
  userFilterSelection.value = { [fieldNamefromLabel[searchFilters.value[0].label]]: searchFilters.value[0].options[1].value }
  console.log('userFilterSelection.value onmounted', userFilterSelection.value)
  searchES()
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
          <!-- Filter by -->
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
              @change="(e) => {
                // value is implied within template tags, so only assign to userFilterSelection
                userFilterSelection = { [fieldNamefromLabel[filter.label]]: e.target.value }
                searchES()
              }"
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
                {{ option.label }}
              </option>
            </select>
          </div>
          <!-- Sort Order -->
          <div>
            <label
              for="sortorder"
              class="sort-label"
            >Sort order</label>
            <select
              id="sortorder"
              name="sortorder"
            >
              <option value="oldestdate">Sort by: Date (oldest)</option>
              <option value="newestdate">Sort by: Date (newest)</option>
            </select>
          </div>

          <BlockTag
            v-if="!isLoading"
            data-test="total-results"
            class="total-results"
            :label="totalResultsDisplay"
          />
        </span>
        <!-- {{ parsedCollectionResults }} -->
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
main.blue-main {
  background-color: var(--pale-blue);
}

.page-collections-list-of-items {

  label.select-label,
  label.sort-label {
    display: none;
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

      .total-results {
        background-color: #132941; // navyblue
        margin-left: auto; // pins the total results to the right
      }
    }

    .search-results-list {
      margin: 0 auto;

      :deep(.card-meta) {
        min-height: 150px;
      }
    }

    // :deep(.section-pagination) {
    //   margin-inline: auto;
    //   padding: 2.5%;
    // }
  }
}
</style>
