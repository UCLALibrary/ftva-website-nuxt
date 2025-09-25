<script setup lang="ts">
// SVG
import SvgGlyphX from 'ucla-library-design-tokens/assets/svgs/icon-ftva-xtag.svg'
import parseFilters from '@/utils/parseFilters'
import parseImage from '@/utils/parseImage'
import useMobileOnlyInfiniteScroll from '@/composables/useMobileOnlyInfiniteScroll'

const route = useRoute()
const documentsPerPage = 10

// const totalPages = ref<number>(0)
const totalResults = ref<number>(0)
// const currentPage = ref<number>(1)
const noResultsFound = ref<boolean>(false)
const { paginatedSiteSearchQuery, fetchAggregationForKeyword } = useSiteSearch()
// const searchResults = ref([] as any)

interface AggregationBucket {
  key: string
  doc_count: number
}

interface Aggregations {
  [key: string]: { buckets: AggregationBucket[] }
}
interface Option {

  value: string // Optional value for the option, if needed.
  labelDesktop: string // Optional label for desktop view.
  label: string
  highlighted?: boolean // Optional class for styling, e.g., 'highlightFilter'
  count?: number // Optional count for the filter group, if needed.
}

interface FilterResult {
  name: string // The name of the filter group (e.g., "Event Type").
  searchField: string // The corresponding search field in Elasticsearch.
  desktopOptions: Option[] // The options available for this filter group.
  options: string[] // Optional string options for the filter group, for mobile dropdown

}
const resetSearchFilters: FilterResult = {

  name: 'Filter Results',
  searchField: 'groupName.keyword',
  desktopOptions: [
    { value: 'Collections', label: 'Collections', labelDesktop: 'Collections (0)', highlighted: false, count: 0 },
    { value: 'Articles', label: 'Articles', labelDesktop: 'Articles (0)', highlighted: false, count: 0 },
    { value: 'Events', label: 'Events', labelDesktop: 'Events (0)', highlighted: false, count: 0 },
    { value: 'Series', label: 'Series', labelDesktop: 'Series (0)', highlighted: false, count: 0 },
    { value: 'General Content', label: 'General Content', labelDesktop: 'General Content (0)', highlighted: false, count: 0 }
  ],
  options: ['Collections (0)', 'Articles (0)', 'Events (0)', 'Series (0)', 'General Content (0)'] // Optional string options for the filter group, for mobile dropdown

}
const searchFilters = ref<FilterResult>(resetSearchFilters)

// TYPES
interface FilterItem {
  [key: string]: string[]
}
const userFilterSelection = ref<FilterItem>({})
const selectedGroupNameFilters = ref<{ 'groupName.keyword': string[] }>({ 'groupName.keyword': [] })
const selectedSortFilters = ref<{ sortField: string }>({ sortField: '' })
const sortField = ref('_score') // default sort field
const orderBy = ref('desc') // default order by
// "STATE"
const searchResultsFetchFunction = async (page: number) => {
  // console.log('searchResultsFetchFunction called with page:', userFilterSelection.value)
  if (page === 2 && totalResults.value <= 10) {
    page = 1 // reset to page 1 if total results are less than or equal to 10
  }
  const queryQ = Array.isArray(route.query.q) ? route.query.q[0] : (route.query.q || '')
  if (queryQ && queryQ !== '') {
    const currentFilterField = searchFilters.value.searchField
    const selectedFilters = selectedGroupNameFilters.value[currentFilterField] || []
    // console.log('selectedFilters', selectedFilters, userFilterSelection.value)

    const aggregations: Aggregations = await fetchAggregationForKeyword(queryQ)
    let updatedOptions: Option[] = []
    // Iterate over the aggregations in the Elasticsearch response
    for (const [key, value] of Object.entries(aggregations)) {
      // Extract the bucket keys as options
      updatedOptions = value.buckets.map((bucket) => {
        return {
          count: bucket.doc_count, // Count of documents in this bucket
          value: bucket.key,
          label: bucket.key, // Label for the option, including the count
          labelDesktop: bucket.key + ` (${bucket.doc_count})`, // no count initally, will be updated later
          highlighted: selectedFilters.includes(bucket.key) // Initially set to false, will be updated later if needed
        }
      })
    }
    resetSearchFilters.desktopOptions = [...updatedOptions] // Reset the options to the updated ones
    const results = await paginatedSiteSearchQuery(
      queryQ,
      page,
      documentsPerPage,
      selectedGroupNameFilters.value,
      sortField.value,
      orderBy.value,
    )
    return results
  } else {
    desktopItemList.value = []
    mobileItemList.value = []
    noResultsFound.value = true
    totalResults.value = 0
    totalPages.value = 0
    console.log('No query provided, resetting search results and filters', resetSearchFilters)
    searchFilters.value = resetSearchFilters
    console.log('No query provided, resetting search results and filters', searchFilters.value)
  }
  return {}
}
const onResults = (results) => {
  // console.log('searchResults', results)
  if (results && results.hits && results.hits.hits.length > 0) {
    const newSearchResults = results.hits.hits || []
    if (isMobile.value) {
      totalPages.value = 0
      mobileItemList.value.push(...newSearchResults)
      desktopItemList.value = []
      totalResults.value = results.hits.total.value
      searchFilters.value = addHighlightStateAndCountToFilters(results.aggregations || {})
      hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
    } else {
      desktopItemList.value = newSearchResults
      mobileItemList.value = []
      totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)

      searchFilters.value = addHighlightStateAndCountToFilters(results.aggregations || {})
      totalResults.value = results.hits.total.value
    }
    userFilterSelection.value['groupName.keyword'] = updateCountInFilters(
      searchFilters.value.desktopOptions
    )
    noResultsFound.value = false
    // console.log('searchFilters updated', searchFilters.value)
    // console.log('userFilterSelection updated', userFilterSelection.value)
  } else {
    mobileItemList.value = []
    desktopItemList.value = []
    noResultsFound.value = true
    totalPages.value = 0
    totalResults.value = 0
    searchFilters.value = resetSearchFilters
    // console.log('No results found, resetting search results and filters', searchFilters.value)
    hasMore.value = false
  }
}
// mostly provided by 'useMobileOnlyInfiniteScroll' composable
const { isLoading, isMobile, hasMore, desktopPage, desktopItemList, mobileItemList, totalPages, currentPage, currentList, scrollElem, reset, searchES } = useMobileOnlyInfiniteScroll(searchResultsFetchFunction, onResults)

// PAGINATION SCROLL HANDLING
// Element reference for the scroll target
const resultsSection = ref<HTMLElement>(null)
// usePaginationScroll composable
const { scrollTo } = usePaginationScroll()
// SORT SETUP - uses static data
const sortDropdownData = {
  options: [
    { label: 'Title (A-Z)', value: 'title asc', sortBy: 'titleSort', orderBy: 'asc' },
    { label: 'Title (Z-A)', value: 'title desc', sortBy: 'titleSort', orderBy: 'desc' },
    { label: 'Date (oldest)', value: 'date asc', sortBy: 'postDate', orderBy: 'asc' }, // TODO ask @axa which craft date field to use here
    { label: 'Date (newest)', value: 'date desc', sortBy: 'postDate', orderBy: 'desc' }, // TODO ask @axa which craft date field to use here
  ],
  label: 'Sort by',
  fieldName: 'sortField'
}

watch(() => route.query, async (newVal, oldVal) => {
  isLoading.value = false
  isMobile.value ? mobileItemList.value = [] : desktopItemList.value = []

  hasMore.value = true
  const queryFilters = parseFilters(route.query.filters || '')
  selectedGroupNameFilters.value['groupName.keyword'] = queryFilters['groupName.keyword'] ? queryFilters['groupName.keyword'] : []
  console.log('selectedGroupNameFilters updated', selectedGroupNameFilters.value)
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

  await searchES()
  await nextTick()
  if (!isMobile.value && route.query.page && resultsSection.value && parsedResults.value.length > 0) {
    await scrollTo(resultsSection)
  }
}, { deep: true, immediate: true })

function addHighlightStateAndCountToFilters(aggregations: Aggregations): FilterResult {
  let updatedOptions: Option[] = []

  const currentFilterField = searchFilters.value.searchField
  const selectedFilters = selectedGroupNameFilters.value[currentFilterField] || []
  // console.log('selectedFilters', selectedFilters, userFilterSelection.value)
  const filters = {
    name: 'Filter Results', // The name of the filter group (e.g., "Event Type").
    searchField: currentFilterField,
    options: [],
    desktopOptions: updatedOptions
  }
  // Iterate over the aggregations in the Elasticsearch response
  for (const [key, value] of Object.entries(aggregations)) {
    // Extract the bucket keys as options
    updatedOptions = value.buckets.map((bucket) => {
      return {
        count: bucket.doc_count, // Count of documents in this bucket
        value: bucket.key,
        label: bucket.key, // Label for the option, including the count
        labelDesktop: bucket.key + ` (${bucket.doc_count})`, // no count initally, will be updated later
        highlighted: selectedFilters.includes(bucket.key) // Initially set to false, will be updated later if needed
      }
    })
  }
  /* if (selectedFilters.length === 0) {

     resetSearchFilters.options = [...updatedOptions]// Reset the options to the updated ones
     console.log('No filters selected, using updated options from aggregations:', resetSearchFilters.options)
   } */

  for (const item of resetSearchFilters.desktopOptions) {
    const existingOption = updatedOptions.find(opt => opt.value === item.value)
    if (!existingOption) {
      updatedOptions.push(item) // Add the initial options if they don't exist in the aggregations
    }
  }

  filters.options = updatedOptions.map((option) => {
    return `${option.label} (${option.count})`
  })
  filters.desktopOptions = updatedOptions
  return filters
}

const parsedResults = computed(() => {
  // console.log('searchResults.value', currentList.value)

  return currentList.value.map((obj) => {
    return {
      ...obj._source,
      category: obj._source.groupName !== 'Series' ? obj._source.groupName.replace(/s$/, '') : obj._source.groupName,
      date: obj._source.sectionHandle !== 'ftvaEvent' && obj._source.sectionHandle !== 'ftvaEventSeries' && obj._source.groupName !== 'Collections' && obj._source.groupName !== 'General Content' ? obj._source.postDate || '' : '', // TODO rethink date field in blockstafarticlelist component, refactor to use another customslot for fva dates for postdate in sectionstaffarticlelist
      startDate: obj._source.startDate || '',
      enddate: obj._source.endDate || '',
      ongoing: obj._source.ongoing || false,
      description: obj._source.ftvaHomepageDescription || obj._source.description || obj._source.summary || obj._source.text || obj._source.eventDescription || obj._source.richtext || '',
      title: obj._source.title || obj._source.name || obj._source.headline || obj._source.eventTitle || '',
      to: obj._source.sectionHandle !== 'ftvaGeneralContentPage' ? `/${obj._source.uri?.replace(/^\//, '')}` : `${obj._source.uri.replace(/^ftva/, '')}`,
      image: parseImage(obj)
    }
  })
})

const router = useRouter()

function updateGroupNameFilters(newFilter) {
  console.log('updateGroupNameFilters called with newFilter:', JSON.stringify(newFilter))
  console.log('resetSearchFilters:', resetSearchFilters.desktopOptions)
  // Extract valid option values from desktopOptions (without counts)
  const validOptions = resetSearchFilters.desktopOptions.map(option => option.value)
  console.log('validOptions:', validOptions)

  newFilter['groupName.keyword'] = (newFilter['groupName.keyword'] || []).map((item) => {
    const match = validOptions.find(valid => item.trim().startsWith(valid))
    return match || null
  }).filter(Boolean)
  const newFilterString = newFilter['groupName.keyword'].length > 0
    ? `groupName.keyword:(${newFilter['groupName.keyword'].join(',')})`
    : ''

  console.log('newFilter after processing:', newFilter)
  router.push({
    path: route.path,
    query: {
      q: route.query.q,
      filters: newFilterString,
      sort: selectedSortFilters.value.sortField,
      // ignore page, we want to clear page # when filter is cleared
    }
  })
}
function updateSort(newSort) {
  // console.log('updateSort called with newSort:', newSort)
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

function parseFilterStringToObject(filterString: string): { [key: string]: string[] } {
  if (!filterString) return {}

  const [field, values] = filterString.split(':(')
  if (!field || !values) return {}

  return { [field]: values.replace(')', '').split(',') }
}

function omitParam(query: any, option: Option) {
  const { page, filters, ...rest } = query

  const filterObj = parseFilterStringToObject(filters)
  const field = Object.keys(filterObj)[0] || 'groupName.keyword'

  // Make sure the filter array exists
  if (!filterObj[field]) {
    filterObj[field] = []
  }

  if (option.highlighted) {
    // Remove the selected filter (toggle off)
    filterObj[field] = filterObj[field].filter(value => value !== option.value)

    if (filterObj[field].length === 0) {
      // If no values left for this field, remove the field
      delete filterObj[field]

      // If no filters left at all, return query without filters
      if (Object.keys(filterObj).length === 0) {
        return { ...rest }
      }
    }

    // Return updated query with remaining filters
    return {
      ...rest,
      filters: `${field}:(${filterObj[field].join(',')})`
    }
  }

  // If filter not selected, add it (toggle on)
  if (!filterObj[field].includes(option.value)) {
    filterObj[field].push(option.value)
  }

  return {
    ...rest,
    filters: `${field}:(${filterObj[field].join(',')})`
  }
}

const startCount = computed(() => {
  if ((currentPage.value - 1) * documentsPerPage === 0) return 1
  return (currentPage.value - 1) * documentsPerPage + 1
})
const totalResultsDisplay = computed(() => {
  if (isMobile.value) return `${totalResults.value} Results`
  return `${startCount.value} - ${((currentPage.value - 1) * documentsPerPage) + currentList.value.length} of ${totalResults.value} Results`
})

function updateCountInFilters(desktopOptions: Option[]): string[] {
  // Returns an array of filter values that are highlighted (selected)
  return desktopOptions
    .filter(option => option.highlighted)
    .map(option => `${option.value} (${option.count})`)
}
function handleFilterUpdate(updatedFilters) {
  console.log('Filters :', JSON.stringify(userFilterSelection.value), updatedFilters)
  userFilterSelection.value = updatedFilters
  console.log('Filters updated:', JSON.stringify(userFilterSelection.value))
}

function applyChangesToSearch() {
  console.log('applyChangesToSearch called', JSON.stringify(userFilterSelection.value))
  const newFilter = { 'groupName.keyword': userFilterSelection.value['groupName.keyword'] || [] }
  // Extract valid option values from desktopOptions (without counts)
  const validOptions = resetSearchFilters.desktopOptions.map(option => option.value)
  console.log('validOptions:', validOptions)

  newFilter['groupName.keyword'] = (newFilter['groupName.keyword'] || []).map((item) => {
    const match = validOptions.find(valid => item.trim().startsWith(valid))
    return match || null
  }).filter(Boolean)
  const newFilterString = newFilter['groupName.keyword'].length > 0
    ? `groupName.keyword:(${newFilter['groupName.keyword'].join(',')})`
    : ''

  console.log('newFilter after processing:', newFilter)
  console.log('newFilterString:', newFilterString)
  useRouter().push({
    path: route.path,
    query: {
      q: route.query.q,
      filters: newFilterString
    }
  })
}

// Use search query for title
useHead({
  title: computed(() => {
    const q = Array.isArray(route.query.q) ? route.query.q[0] : route.query.q
    return q ? `Search for ${q}` : 'Search'
  }),
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: computed(() => {
        const q = Array.isArray(route.query.q) ? route.query.q[0] : route.query.q
        return q ? `Results for search query "${q}".` : 'Search results page.'
      })
    }
  ]
})
</script>
<template>
  <main class="page page-detail page-detail--paleblue search-page">
    <SectionWrapper
      id="search-section-title"
      ref="scrollElem"
      theme="paleblue"
      class="one-column"
    >
      <NavBreadcrumb
        class="breadcrumb"
        data-test="breadcrumb"
        title="Search Results"
        to="/"
      />
      <ClientOnly>
        <h3
          v-if="route.query.q"
          class="search-title"
        >
          Search Results for <span class="search-keywords">"{{ route.query.q }}"</span>
        </h3>
      </ClientOnly>
      <NavSearch />
    </SectionWrapper>
    <div class="two-column">
      <div
        v-if="!isMobile && !noResultsFound && parsedResults.length !== 0"
        class="sidebar"
      >
        <h4 class="filter-results">
          Filter Results
        </h4>

        <div
          v-for="option in searchFilters.desktopOptions"
          :key="option.value"
          class="filter-option"
        >
          <NuxtLink
            v-show="option.count > 0"
            class=""
            :to="{ query: { ...omitParam(route.query, option) } }"
          >
            <BlockTag
              :label="option.labelDesktop"
              :is-secondary="!option.highlighted"
              :is-primary="option.highlighted"
            >
              <template v-if="option.highlighted">
                <SvgGlyphX class="close-icon" />
              </template>
            </BlockTag>
          </NuxtLink>

          <BlockTag
            v-show="option.count === 0"
            :label="option.labelDesktop"
            :is-secondary="!option.highlighted"
            :is-primary="option.highlighted"
          />
        </div>
      </div>
      <div class="content">
        <ClientOnly>
          <div
            v-if="noResultsFound && parsedResults.length === 0"
            class="no-results"
          >
            <h4 class="no-results-title">
              No results found.
            </h4>
            <p class="no-results-text">
              Looking for a specific collection item? Search the UCLA Film & Television Archive
              Catalog at
              UC Library
              Search
            </p>
            <button-link
              label="UC Library Search"
              icon-name="svg-arrow-right"
              to="https://search.library.ucla.edu/discovery/search?vid=01UCS_LAL:UCLA&mode=advanced"
            />
          </div>
        </ClientOnly>
        <div
          v-show="!noResultsFound
            &&
            totalResults > 0
            "
          ref="el"
          class="results"
        >
          <!--p>Results will be displayed here.</p-->
          <div
            v-if="parsedResults.length > 0"
            ref="resultsSection"
            class="results-container"
          >
            <!-- Sort by -->
            <div class="sort-and-results">
              <!-- mobile filters -->
              <span class="dropdown-wrapper">
                <filters-dropdown
                  v-show="isMobile"
                  v-model:selected-filters="userFilterSelection"
                  :filter-groups="[searchFilters]"
                  data-test="filters-dropdown"
                  class="sort-dropdown"
                  @update-display="(newFilterSelection) => {
                    updateGroupNameFilters(newFilterSelection)
                  }"
                />
                <DropdownSingleSelect
                  v-model:selected-filters="selectedSortFilters"
                  :label="sortDropdownData.label"
                  :options="sortDropdownData.options"
                  :field-name="sortDropdownData.fieldName"
                  class="sort-dropdown"
                  @update-display="(newSort) => {
                    updateSort(newSort)
                  }"
                />
              </span>
              <section-remove-search-filter
                v-if="isMobile && Object.keys(userFilterSelection).length > 0"
                :filters="userFilterSelection"
                class="remove-filters"
                @update:filters="handleFilterUpdate"
                @remove-selected="applyChangesToSearch"
              />
              <DividerWayFinder
                v-if="isMobile"
                class="divider"
              />
              <BlockTag
                class="total-results"
                :label="totalResultsDisplay"
              />
            </div>

            <SectionStaffArticleList
              :items="parsedResults"
              class="search-results-list"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="one-column-pagination">
      <SectionPagination
        v-if="totalPages !== 1 && !isMobile"
        :pages="totalPages"
        :initial-current-page="currentPage"
        :fixed-page-width-mode="true"
        :fixed-page-width-num="10"
      />
    </div>
    <SectionWrapper
      v-if="!noResultsFound && parsedResults.length !== 0"
      theme="paleblue"
    >
      <block-call-to-action
        class=""
        v-bind="{ title: 'Looking for a specific collection item?', text: 'Search the UCLA Film & Television Archive Catalog at UC Library Search', name: 'UC Library Search', to: 'https://search.library.ucla.edu/discovery/search?vid=01UCS_LAL:UCLA&mode=advanced', isDark: false, svgName: 'svg-call-to-action-question' }"
      />
    </SectionWrapper>
  </main>
</template>
<style lang="scss" scoped>
:deep(.button-dropdown-modal-wrapper.is-expanded) {
  z-index: 1000;
}

.search-page {
  .one-column {
    :deep(.nav-breadcrumb ol) {
      padding: 0;
    }

    .search-title {
      padding-left: 2rem;
      line-height: 1.2;
      @include ftva-h4;
      color: $medium-grey;

      .search-keywords {
        @include ftva-h3;
        color: $heading-grey;
      }
    }

    :deep(.ftva.nav-search) {
      background-color: var(--pale-blue);
      padding-bottom: 36px;

      .bottom-row {
        @include ftva-breadcrumb-inactive;
        color: $medium-grey;

        .bottom-link {
          @include ftva-button-link;
          color: $accent-blue;
        }
      }
    }
  }

  :deep(.ftva.block-call-to-action.theme-light) {
    background-color: $white;
  }

  .two-column {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    flex-wrap: nowrap;
    max-width: var(--ftva-container-max-width);
    position: relative;
    width: 100%;
    min-height: 500px;

    margin: 0 auto;
    margin-top: 60px;

    .content {
      margin-bottom: 0;
      flex: 1;

      .sort-and-results {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin-bottom: 35px;

        .total-results {
          :deep(.label) {
            text-align: center;
          }

          background-color: var(--dark-navy);
        }
      }

      :deep(.ftva.section-staff-article-list) {
        padding: 0;

        li.block-staff-article-item {
          &:not(:last-child) {
            border-bottom: 1px solid var(--pale-blue);
          }

        }

        .ftva.block-staff-article-item {
          --image-min-width: 240px;

          .image {
            .sizer {
              padding-bottom: 0 !important;
            }
          }

          .meta {
            margin: 0;
          }

          .ftva-date {
            color: #676767;
            font-family: "proxima-nova", Helvetica, Arial, sans-serif;
            font-size: 16px;
            font-style: normal;
            font-weight: 400;
            text-transform: unset;
          }
        }
      }

      .search-results-list {
        margin-bottom: 2rem;
      }

      .no-results {
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        justify-content: space-between;
        align-content: center;
        align-items: center;
        gap: 1rem;
        margin-bottom: 30px;

        .no-results-title {
          @include ftva-h4;
          color: $heading-grey;
        }

        .no-results-text {
          @include ftva-breadcrumb-inactive;
          color: $heading-grey;
        }
      }

      .ftva.section-pagination {
        margin-left: 100px;
        padding: 3%;

      }
    }

    .sidebar {
      margin-bottom: 0;
      flex-basis: 33%;
      max-width: 275px;
      padding-bottom: 60px;

      .filter-results {
        @include ftva-card-title-1;
        color: $medium-grey;
        margin-bottom: 2rem;
      }

      .filter-option {
        margin-bottom: 0.5rem;

        :deep(.block-tag) {
          height: auto;
        }

        .close-icon {
          margin: 5px 0 5px 5px;
        }

        a {
          text-decoration: none;
        }
      }
    }
  }

  .one-column-pagination {
    width: 100%;
    max-width: var(--ftva-container-max-width);
    padding: 28px 2.5% 60px;
    margin: 0 auto;

    .section-pagination {
      padding-left: 0;
      margin: 0 auto;
    }
  }

  .section-wrapper:last-of-type {
    padding-bottom: 120px; // Footer spacing
  }

  @media screen and (max-width: 834px) {

    :deep(.ftva.block-staff-article-item .title) {
      -webkit-line-clamp: 2;
    }
  }

  @media #{$small} {
    :deep(.ftva.section-staff-article-list .block-staff-article-list) {
      padding: 16px;
    }

    :deep(.ftva.section-staff-article-list .block-staff-article-list .block-staff-article-item) {
      border-radius: 0;

      .meta {
        padding: 0;
        gap: 8px;

        .category {
          font-size: 18px;
        }

        .title {
          -webkit-line-clamp: unset;
        }

        .ftva-description {
          margin-bottom: 0;
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          font-size: 16px;
          line-height: 1.5;
        }

        .ftva-date {
          font-size: 18px;
          font-weight: 500;
          font-family: Karbon;
          margin-top: 4px;
        }
      }
    }

    :deep(.ftva.section-staff-article-list .block-staff-article-list .block-staff-article-item) {
      &:not(:last-child) {
        border-bottom: 1px solid #e7edf2;
        margin-bottom: 20px;
        padding-bottom: 20px;
      }
    }

    :deep(.ftva.block-staff-article-item) {

      figure,
      .molecule-no-image {
        display: none;
      }
    }

    .two-column {

      .content {
        width: 100%;
      }

      .no-results {
        margin: 0 25px 20px 25px;
      }

      .results {
        margin-left: 20px;
        margin-right: 20px;

        .sort-and-results {
          flex-direction: column;
          justify-content: center;
          margin-left: auto;
          margin-right: auto;

          .dropdown-wrapper {
            display: flex;
            width: 100%;
            flex-direction: row;
            gap: 16px;

            .sort-dropdown {
              width: 100%;

              :deep(button) {
                width: 100%;
              }
            }
          }

          .total-results {
            align-self: end;
          }
        }

        .remove-filters {
          margin-top: 0;
          margin-bottom: 0;
          padding-top: 20px;
        }

        .divider {
          width: 100%;
          padding-left: 0px;
          padding-right: 0px;
        }
      }

      :deep(.ftva.mobile-drawer .mobile-button) {
        border-color: #115daf;
        color: #0b6ab7;
      }

      :deep(.filter-summary) {
        color: #115daf;
      }

      :deep(.filters-dropdown .mobile-button) {
        padding: 10px;
      }

      :deep(.ftva.filters-dropdown .icon-svg svg path.svg__fill--accent-blue) {
        fill: #0b6ab7;
      }
    }

    .section-wrapper:last-of-type {
      padding-bottom: 86px; // Footer spacing
    }
  }
}
</style>
