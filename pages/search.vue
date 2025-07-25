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
const { paginatedSiteSearchQuery } = useSiteSearch()
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
  options: Option[] // The options available for this filter group.

}
const searchFilters = ref<FilterResult>(resetSearchFilters())

function resetSearchFilters(): FilterResult {
  return {
    name: 'groupName.keyword',
    searchField: 'groupName.keyword',
    options: [
      { value: 'Collections', label: 'Collections', labelDesktop: 'Collections (0)', highlighted: false, count: 0 },
      { value: 'Articles', label: 'Articles', labelDesktop: 'Articles (0)', highlighted: false, count: 0 },
      { value: 'Events', label: 'Events', labelDesktop: 'Events (0)', highlighted: false, count: 0 },
      { value: 'Series', label: 'Series', labelDesktop: 'Series (0)', highlighted: false, count: 0 },
      { value: 'General Content', label: 'General Content', labelDesktop: 'General Content (0)', highlighted: false, count: 0 }
    ]
  }
}
// TYPES
interface FilterItem {
  [key: string]: string[]
}
const userFilterSelection = ref<FilterItem>({})
const selectedGroupNameFilters = ref<{ 'groupName.keyword': string }>({ 'groupName.keyword': '' })
const selectedSortFilters = ref<{ sortField: string }>({ sortField: '' })
const sortField = ref('_score') // default sort field
const orderBy = ref('desc') // default order by
// "STATE"
const searchResultsFetchFunction = async (page: number) => {
  console.log('searchResultsFetchFunction called with page:', userFilterSelection.value)
  const queryQ = Array.isArray(route.query.q) ? route.query.q[0] : (route.query.q || '')
  if (queryQ && queryQ !== '') {
    const results = await paginatedSiteSearchQuery(
      queryQ,
      page,
      documentsPerPage,
      userFilterSelection.value,
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
    searchFilters.value = resetSearchFilters()
    // console.log('No query provided, resetting search results and filters')
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

    noResultsFound.value = false
  } else {
    mobileItemList.value = []
    desktopItemList.value = []
    noResultsFound.value = true
    totalPages.value = 0
    totalResults.value = 0
    searchFilters.value = resetSearchFilters()
    hasMore.value = false
  }
}
// mostly provided by 'useMobileOnlyInfiniteScroll' composable
const { isLoading, isMobile, hasMore, desktopPage, desktopItemList, mobileItemList, totalPages, currentPage, currentList, scrollElem, reset, searchES } = await useMobileOnlyInfiniteScroll(searchResultsFetchFunction, onResults)

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
    isLoading.value = false
    isMobile.value ? mobileItemList.value = [] : desktopItemList.value = []

    hasMore.value = true
    userFilterSelection.value = parseFilters(route.query.filters || '')
    selectedGroupNameFilters.value['groupName.keyword'] = userFilterSelection.value['groupName.keyword'] ? userFilterSelection.value['groupName.keyword'][0] : ''
    console.log('userFilterSelection updated', userFilterSelection.value)
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
        value: bucket.key,
        label: bucket.key, // Label for the option, including the count
        labelDesktop: bucket.key + ` (${bucket.doc_count})`, // no count initally, will be updated later
        highlighted: selectedFilters.includes(bucket.key) // Initially set to false, will be updated later if needed
      }
    })
  }
  for (const item of resetSearchFilters().options) {
    const existingOption = updatedOptions.find(opt => opt.value === item.value)
    if (!existingOption) {
      updatedOptions.push(item) // Add the initial options if they don't exist in the aggregations
    }
  }

  filters.options = updatedOptions
  return filters
}

const parsedResults = computed(() => {
  // console.log('searchResults.value', searchResults.value)

  return currentList.value.map((obj) => {
    return {
      ...obj._source,
      category: obj._source.groupName !== 'Series' ? obj._source.groupName.replace(/s$/, '') : obj._source.groupName,
      date: obj._source.sectionHandle !== 'ftvaEvent' && obj._source.sectionHandle !== 'ftvaEventSeries' ? obj._source.postDate || '' : '', // TODO rethink date field in blockstafarticlelist component, refactor to use another customslot for fva dates for postdate in sectionstaffarticlelist
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
  // console.log('updateGroupNameFilters called with newFilter:', JSON.stringify(newFilter), newFilter[0])

  router.push({
    path: route.path,
    query: {
      q: route.query.q,
      filters: 'groupName.keyword' + ':(' + newFilter['groupName.keyword'] + ')',
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

function omitParam(query: any, option: Option) {
  // Clone the current query object
  const { page, filters, ...rest } = query

  if (option.highlighted) {
    // If highlighted, remove both page and filters
    return { ...rest }
  } else {
    // If not highlighted, remove page, and set filters to groupName.keyword:(option.value)
    return {
      ...rest,
      filters: `groupName.keyword:(${option.value})`
    }
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

</script>
<template>
  <main class="page page-detail page-detail--paleblue search-page">
    <SectionWrapper
      ref="scrollElem"
      theme="paleblue"
      class="one-column"
    >
      <NavBreadcrumb
        class="breadcrumb"
        data-test="breadcrumb"
        title="Search Results"
        to="/"
        parent-title="Home"
      />
      <h3
        v-if="route.query.q"
        class="search-title"
      >
        Search Results for <span class="search-keywords">"{{ route.query.q }}"</span>
      </h3>

      <NavSearch />
    </SectionWrapper>
    <div class="two-column">
      <div
        v-if="!isMobile"
        class="sidebar"
      >
        <h4 class="filter-results">
          Filter Results
        </h4>

        <div
          v-for="option in searchFilters.options"
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
        <div
          v-if="noResultsFound && parsedResults.length === 0"
          class="no-results"
        >
          <h4 class="no-results-title">
            No results found.
          </h4>
          <p class="no-results-text">
            Not finding what you’re looking for? Try searching for another term or search using
            UC Library Search
          </p>
          <button-link
            label="UC Library Search"
            icon-name="svg-arrow-right"
            to="https://search.library.ucla.edu/discovery/search?vid=01UCS_LAL:UCLA&tab=Articles_books_more_slot&search_scope=ArticlesBooksMore&lang=en&query=any,contains,"
          />
        </div>
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
            class="results-container"
          >
            <!-- Sort by -->
            <div class="sort-and-results">
              <!-- mobile filters -->
              <span class="dropdown-wrapper">
                <DropdownSingleSelect
                  v-show="isMobile"
                  v-model:selected-filters="selectedGroupNameFilters"
                  label="Filter Results"
                  :options="searchFilters.options"
                  field-name="groupName.keyword"
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

            <SectionPagination
              v-if="totalPages !== 1 && !isMobile"
              :pages="totalPages"
              :initial-current-page="currentPage"
            />
          </div>
        </div>
      </div>
    </div>
    <SectionWrapper
      v-if="!noResultsFound && parsedResults.length !== 0"
      theme="paleblue"
    >
      <block-call-to-action
        class=""
        v-bind="{ title: 'Not finding what you are looking for?', text: 'Try searching using UC Library Search', name: 'UC Library Search', to: 'https://search.library.ucla.edu/discovery/search?vid=01UCS_LAL:UCLA&tab=Articles_books_more_slot&search_scope=ArticlesBooksMore&lang=en&query=any,contains,', isDark: false, svgName: 'svg-call-to-action-question' }"
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

    .breadcrumb {
      padding-top: 2rem;
      padding-left: 2rem;
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

    margin: 0 auto;
    margin-top: 60px;

    .content {
      margin-bottom: 0;
      flex: 1;

      .sort-and-results {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 35px;
        // margin-right: 1rem;

        .total-results {
          :deep(.label) {
            text-align: center;
          }

          background-color: #132941; // navyblue
        }
      }

      :deep(.ftva.section-staff-article-list) {
        padding: 0;
        // margin-right: 1rem;

        li.block-staff-article-item {
          &:not(:last-child) {
            border-bottom: 1px solid var(--pale-blue);
          }

          .category {
            @include ftva-subtitle-1;
            color: $accent-blue;
          }

          .title {
            @include truncate(2);
          }

          .molecule-no-image {
            width: 500px;
            height: 213px;
            aspect-ratio: 3 / 1;
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

        .no-results-title {
          @include ftva-h4;
          color: $heading-grey;
        }

        .no-results-text {
          @include ftva-breadcrumb-inactive;
          color: $heading-grey;
        }
      }

      :deep(.ftva.block-staff-article-item:last-child) {
        .date {
          height: auto;
          @include ftva-subtitle-2;
          color: $subtitle-grey;
        }
      }

      :deep(.ftva.block-staff-article-item .date) {
        @include ftva-subtitle-2;
        color: $subtitle-grey;
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
      // padding: 0 1rem;
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

  @media #{$small} {
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

        .divider {
          width: 100%;
          padding-left: 0px;
          padding-right: 0px;
        }
      }

      :deep(li.block-staff-article-item) {

        figure,
        .molecule-no-image {
          display: none;
        }
      }
    }
  }
}
</style>
