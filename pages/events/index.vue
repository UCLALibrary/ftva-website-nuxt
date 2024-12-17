<script setup lang="ts">
// COMPONENTS
import { SectionWrapper } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'
import { parseISO } from 'date-fns'
import { useWindowSize, useInfiniteScroll } from '@vueuse/core'

// UTILS
import FTVAEventList from '../gql/queries/FTVAEventList.gql'
import parseFilters from '@/utils/parseFilters'
import { getEventFilterLabels } from '~/utils/getEventFilterLabels'

// GQL
const { $graphql } = useNuxtApp()
const { data, error } = await useAsyncData('event-list', async () => {
  const data = await $graphql.default.request(FTVAEventList)
  return data
})
if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entry) {
  // console.log('no data')
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}
const heading = ref(_get(data.value, 'entry', {}))

// TYPES
interface FilterItem {
  [key: string]: string[]
}

interface EventItem {
  _source: {
    uri: string
    startDate: string
    imageCarousel?: { image: { url: string }[] }[]
    [key: string]: any
  }
  [key: string]: any
}

interface AggregationBucket {
  key: string
  doc_count: number
}

interface Aggregations {
  [key: string]: { buckets: AggregationBucket[] }
}
interface FilterGroup {
  name: string; // The name of the filter group (e.g., "Event Type").
  searchField: string; // The corresponding search field in Elasticsearch.
  options: string[]; // The options available for this filter group.
}
// State Management
const desktopPage = useState<number>('desktopPage', () => 1) // Persist desktop page

// STATE
const desktopEvents = ref([]) // Desktop events list
const mobileEvents = ref([]) // Mobile events list
const events = computed((): EventItem[] => (isMobile.value ? mobileEvents.value : desktopEvents.value))
// userFilterSelection is used by FilterDropdown component to display selected filters, but also update selected items in filter groups
// therefore, it MUST always have a key for each filter group in the dropdown, even if the value is an empty array
const userFilterSelection = ref<FilterItem>({ 'ftvaEventTypeFilters.title.keyword': [], 'ftvaScreeningFormatFilters.title.keyword': [] })
const userDateSelection = ref<string[]>([])
const allFilters = ref<FilterItem>({})
const userViewSelection = ref<string>('list')
const documentsPerPage = 10
const totalPages = ref<number>(0)
const currentPage = ref<number>(1)
const route = useRoute()
const noResultsFound = ref<boolean>(false)
const isLoading = ref<boolean>(false)
const isMobile = ref<boolean>(false)
const hasMore = ref(true) // Flag to control infinite scroll

// Window Size Handling
const { width } = useWindowSize()
watch(width, (newWidth) => {
  const wasMobile = isMobile.value
  isMobile.value = newWidth <= 750

  // Reinitialize only when transitioning between mobile and desktop
  if (wasMobile !== isMobile.value) {
    handleScreenTransition()
  }
}, { immediate: true })

// Handle screen transitions
function handleScreenTransition() {
  if (isMobile.value) {
    // Switching to mobile: save desktop page, clear query param
    desktopPage.value = currentPage.value
    currentPage.value = 1
    mobileEvents.value = []
    hasMore.value = true
    const { page, ...remainingQuery } = route.query
    useRouter().push({ query: remainingQuery })
  } else {
    // Switching to desktop: restore query param
    if (totalPages.value === 1) desktopPage.value = 1
    const restoredPage = desktopPage.value || 1
    useRouter().push({ query: { ...route.query, page: restoredPage.toString() } })
    currentPage.value = restoredPage
    desktopEvents.value = []
  }
  searchES()
}

const parsedRemoveSearchFilters = computed(() => {
  const removefilters: FilterItem = {}
  const datesObj = userDateSelection.value
  // console.log('parsedRemoveSearchFilters', datesObj)
  if (datesObj && datesObj.length === 2) {
    removefilters.dates = [`${datesObj[0]},${datesObj[1]}`]
  }
  if (datesObj && datesObj.length === 1) {
    removefilters.dates = [datesObj[0]]
  }
  // console.log('parsedRemoveSearchFilters', removefilters)
  /*
  Sample ftva filters selection data structure
  {
    ftvaEventTypeFilters.title.keyword: ['Film', 'Theater'],
    ftvaScreeningFormatFilters.title.keyword: ['Online'],
  }
  */
  for (const key in userFilterSelection.value) {
    if (userFilterSelection.value[key].length > 0) {
      removefilters[key] = userFilterSelection.value[key]
    }
  }
  // console.log('In parsedFilters SectionRemoveSearchfilter component', removefilters, JSON.stringify(Object.entries(removefilters)))

  return removefilters
})

// This watcher is called when router pushes updates the query params
watch(
  () => route.query,
  (newVal, oldVal) => {
    const selectedFiltersFromRoute = parseFilters(route.query.filters || '')
    userFilterSelection.value = { 'ftvaEventTypeFilters.title.keyword': [], 'ftvaScreeningFormatFilters.title.keyword': [], ...selectedFiltersFromRoute } // ensure all filter groups are present
    currentPage.value = route.query.page ? parseInt(route.query.page as string) : 1
    userViewSelection.value = (route.query.view as string | undefined) || 'list'
    // console.log('route.query.dates', route?.query?.dates)
    userDateSelection.value = parseDateFromURL(route.query.dates as string | undefined) || []
    allFilters.value = parsedRemoveSearchFilters.value
    // console.log('userDateSelection.value', userDateSelection.value)
    isMobile.value ? mobileEvents.value = [] : desktopEvents.value = []
    hasMore.value = true
    searchES()
  }, { deep: true, immediate: true }
)
// SEARCH
const searchFilters = ref([] as FilterGroup[])
// fetch filters for the page from ES after page loads in Onmounted hook on the client side
async function setFilters() {
  const searchAggsResponse: Aggregations = await useIndexAggregator()
  // console.log('Search Aggs Response: ' + JSON.stringify(searchAggsResponse))
  // Transform the response
  searchFilters.value = transformEsResponseToFilterGroups(searchAggsResponse)
  // console.log('searchFilters', searchFilters.value)
}
onMounted(async () => {
  await setFilters()
  const { allEvents } = useDateFilterQuery()
  /* const testFilters = {
    'ftvaEventTypeFilters.title.keyword': ['Guest speaker', '35mm'],
    'ftvaScreeningFormatFilters.title.keyword': ['DCP', 'Film'],
  } */
  // Logic to fetch all events startDates formated for DateFilter
  const esOutput = await allEvents('ftvaEvent', ['startDate'])
  // console.log(esOutput.hits.total.value)
  if (esOutput.hits.total.value === 0) dateListDateFilter.value = []
  dateListDateFilter.value = esOutput.hits.hits.map(event => event.fields.formatted_date[0])
})

const el = ref<HTMLElement | null>(null)
const { reset } = useInfiniteScroll(
  el,
  async () => {
    if (isMobile.value && hasMore.value && !isLoading.value) {
      currentPage.value++
      await searchES()
    }
  },
  { distance: 100 }
)

function parseDateFromURL(datesParam: string): string[] {
  // console.log('datesParam', datesParam)
  if (datesParam === '') return []
  return datesParam?.split(',')
}

function addHighlightState(tagLabels) {
  // if userFilterSelection.value is an empty object for initial page load, then just return tagLabels array back
  if (Object.keys(userFilterSelection.value).length === 0) return tagLabels
  // loop through the keys of userFilterSelection.value object and its array values
  for (const [key, value] of Object.entries(userFilterSelection.value)) {
    // loop through tagLabels array
    for (let v = 0; v < value.length; v++) {
      for (let i = 0; i < tagLabels.length; i++) {
        // console.log('tagLabels[i].title', tagLabels[i].title)
        // console.log('does it match value?', value[v])
        // if tagLabels.title array has a match with userFilterSelection.value array then set isHighlighted as true
        if (tagLabels[i].title === value[v]) {
          tagLabels[i].isHighlighted = true
        }
      }
    }
  }
  return tagLabels
}

// ELASTIC SEARCH FUNCTION
async function searchES() {
  if (isLoading.value || !hasMore.value) return

  isLoading.value = true

  try {
    const page = currentPage.value
    const size = 10
    let results: any = {}
    if (!isMobile.value || userViewSelection.value === 'list') {
      const { paginatedSearchFilters } = useListSearchFilter()
      results = await paginatedSearchFilters(page, size, 'ftvaEvent', userFilterSelection.value, userDateSelection.value, 'startDate', 'asc')
    } else {
      //  Calendar View code
      const { paginatedSearchFilters } = useCalendarSearchFilter()
      results = await paginatedSearchFilters('ftvaEvent', userFilterSelection.value, userDateSelection.value, 'startDate', 'asc')
    }

    if (results && results.hits && results.hits.total.value > 0) {
      const newEvents = results.hits.hits || []
      if (isMobile.value) {
        mobileEvents.value.push(...newEvents)
        hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
      } else {
        desktopEvents.value = newEvents
        totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)
      }
      noResultsFound.value = false
    } else {
      noResultsFound.value = true
      if (!isMobile.value) totalPages.value = 0
      hasMore.value = false
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    hasMore.value = false
  } finally {
    isLoading.value = false
  }
}
// Get data for Image or Carousel at top of page
function parsedImage(obj) {
  return obj._source.imageCarousel
}
function isImageExists(obj) {
  return !!(parsedImage(obj) && parsedImage(obj).length === 1 && parsedImage(obj)[0]?.image && parsedImage(obj)[0]?.image?.length === 1)
}

const parsedEvents = computed(() => {
  if (events.value.length === 0) return []
  return events.value.map((obj) => {
    return {
      ...obj._source,
      tagLabels: addHighlightState(getEventFilterLabels(obj._source)),
      to: `/${obj._source.uri}`,
      image: isImageExists(obj) ? parsedImage(obj)[0]?.image[0] : null
    }
  })
})

function transformEsResponseToFilterGroups(aggregations: Aggregations): FilterGroup[] {
  // Initialize the filterGroups array
  const filterGroups: FilterGroup[] = []

  // Iterate over the aggregations in the Elasticsearch response
  for (const [key, value] of Object.entries(aggregations)) {
    // Extract the bucket keys as options
    const options = value.buckets.map(bucket => bucket.key)

    // Map the key to the appropriate searchField
    let searchField
    if (key === 'Event Type') {
      searchField = 'ftvaEventTypeFilters.title.keyword'
    } else if (key === 'Film Format') {
      searchField = 'ftvaScreeningFormatFilters.title.keyword'
    }

    // Add the filter group to the array
    if (searchField) {
      filterGroups.push({
        name: key,
        searchField,
        options,
      })
    }
  }

  return filterGroups
}

const dateListDateFilter = ref([])

const parsedInitialDates = computed(() => {
  const initialDates = {
    startDate: null as Date | null,
    endDate: null as Date | null,
  }
  if (userDateSelection.value && userDateSelection.value.length === 1) {
    initialDates.startDate = parseISO(userDateSelection.value[0])
    initialDates.endDate = parseISO(userDateSelection.value[0])
  } else if (userDateSelection.value && userDateSelection.value.length === 2) {
    initialDates.startDate = parseISO(userDateSelection.value[0])
    initialDates.endDate = parseISO(userDateSelection.value[1])
  }
  return initialDates
})

// This is event handler which is invoked by datefilter component selections
function applyDateFilterSelectionToRouteURL(data) {
  desktopEvents.value = []
  mobileEvents.value = []
  // console.log('Data from Date filters', data)

  // Function to format date to yyyy-MM-dd
  const formatDate = (date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0') // Months are 0-based
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  let startDate: string = ''
  let endDate: string = ''
  // Format the dates
  // Combine into a single query parameter
  let datesParam: string = ''
  if (data.startDate) {
    startDate = formatDate(data.startDate)
    datesParam = startDate
  }
  if (data.endDate) {
    endDate = formatDate(data.endDate)
    datesParam = datesParam + ',' + endDate
  }
  const eventFilters = []
  for (const key in userFilterSelection.value) {
    if (userFilterSelection.value[key].length > 0) {
      eventFilters.push(`${key}:(${userFilterSelection.value[key].join(' OR ')})`)
    }
  }
  // Use router.push to navigate with query params
  useRouter().push({
    path: '/events',
    query: {
      dates: datesParam,
      filters: eventFilters.join(' AND '),
      view: userViewSelection.value
    }
  })
}

// This is event handler which is invoked by dropdownfilters component selections
function applyEventFilterSelectionToRouteURL(data) {
  // Use router.push to navigate with query params
  desktopEvents.value = []
  mobileEvents.value = []
  const eventFilters = []
  for (const key in data) {
    if (data[key].length > 0) {
      eventFilters.push(`${key}:(${data[key].join(' OR ')})`)
    }
  }
  useRouter().push({
    path: '/events',
    query: {
      dates: userDateSelection.value.join(','),
      filters: eventFilters.join(' AND '),
      view: userViewSelection.value
    }
  })
}

function applyChangesToSearch() {
  const eventFilters = []
  desktopEvents.value = []
  mobileEvents.value = []
  let dateFilters = ''
  // console.log('applyChangesToSearch allFilters.value', allFilters.value)
  // separate dates and event filters
  for (const key in allFilters.value) {
    if (allFilters.value[key].length > 0) {
      if (key !== 'dates')
        eventFilters.push(`${key}:(${allFilters.value[key].join(' OR ')})`)
      else
        dateFilters = allFilters.value[key][0]
    }
  }

  useRouter().push({
    path: '/events',
    query: {
      dates: dateFilters,
      filters: eventFilters.join(' AND ')
    }
  })
}
function handleFilterUpdate(updatedFilters) {
  allFilters.value = updatedFilters
  // console.log('Filters updated:', allFilters.value)
}

const parseViewSelection = computed(() => {
  return userViewSelection.value === 'list' ? 0 : 1
})
const parseFirstEventMonth = computed(() => {
  if (parsedEvents.value && parsedEvents.value.length > 0) {
    // console.log("parseFirstEventMonth", parsedEvents.value[0].startDate, typeof parsedEvents.value[0].startDate)
    return [new Date(parsedEvents.value[0].startDate)]
  }
  return null
})

// remove this later
const isOpen = ref(false)
function toggleCode() {
  isOpen.value = !isOpen.value
}

</script>

<template>
  <main
    id="main"
    class="page page-events"
  >
    <div class="full-width">
      <SectionWrapper
        class="header"
        theme="paleblue"
        :section-title="heading.titleGeneral"
        :section-summary="heading.summary"
      />

      <SectionWrapper theme="paleblue">
        <date-filter
          :key="dateListDateFilter"
          :event-dates="dateListDateFilter"
          :initial-dates="parsedInitialDates"
          @input-selected="applyDateFilterSelectionToRouteURL"
        />
        <filters-dropdown
          v-model:selected-filters="userFilterSelection"
          :filter-groups="searchFilters"
          @update-display="applyEventFilterSelectionToRouteURL"
        />
        <TabList
          v-if="!isMobile"
          alignment="right"
          :initial-tab="parseViewSelection"
        >
          <TabItem
            title="List View"
            class="tab-content"
          >
            <template v-if="parsedEvents && parsedEvents.length > 0">
              <SectionTeaserList
                :items="parsedEvents"
                component-name="BlockCardThreeColumn"
                :n-shown="10"
                class="tabbed-event-list"
              />

              <section-pagination
                v-if="totalPages !== 1"
                :pages="totalPages"
                :initial-current-page="currentPage"
              />
            </template>
            <template v-else>
              <p
                v-if="noResultsFound"
                class="empty-tab"
              >
                There are no upcoming events WITH THE FILTERS YOU SELECTED
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
            title="Calendar View"
            class="tab-content"
          >
            <template v-if="parsedEvents && parsedEvents.length > 0">
              <div style="display: flex;justify-content: center;">
                <base-calendar
                  :events="parsedEvents"
                  :first-event-month="parseFirstEventMonth"
                />
              </div>
              <br>
              <br>
              <div class="code-container">
                <button
                  class="code-header"
                  @click="toggleCode"
                >
                  {{ isOpen ? 'Click to hide ES data' : 'Click to view ES data' }}
                </button>
                <div
                  v-if="isOpen"
                  class="code-body"
                >
                  <pre> {{ parsedEvents }} </pre>
                </div>
              </div>
            </template>
            <template v-else>
              <p
                v-if="noResultsFound"
                class="empty-tab"
              >
                There are no events found
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
        <div
          v-else
          ref="el"
          class="mobile-container"
        >
          <section-remove-search-filter
            :filters="allFilters"
            class="mobile-remove-filters"
            @update:filters="handleFilterUpdate"
            @remove-selected="applyChangesToSearch"
          />
          <SectionTeaserList
            v-if="parsedEvents && parsedEvents.length > 0"
            :items="parsedEvents"
            component-name="BlockCardThreeColumn"
            :n-shown="events.length"
            class="tabbed-event-list"
          />
          <div v-else>
            <p
              v-if="noResultsFound"
              class="empty-tab"
            >
              There are no events found
            </p>
            <p
              v-else
              class="empty-tab"
            >
              Data loading in progress ...
            </p>
          </div>
        </div>
      </SectionWrapper>
    </div>
  </main>
</template>

<style scoped>
:deep(.button-dropdown-modal-wrapper.is-expanded) {
  z-index: 1000;
}

.page-events {
  position: relative;

  .header {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-content: center;
    align-items: center;
    text-align: center;

    max-width: 787px;
  }

  .full-width {
    width: 100%;
    background-color: var(--pale-blue);
    margin: 0 auto;

  }

  :deep(.tab-list-body) {
    background: none;
  }

  :deep(.section-pagination) {
    /* TODO Move this to ftva sectionwrapper.theme.paleblue scss file */
    background-color: white;
    max-width: unset;
    padding: 2.5%;
  }

  .tab-content {
    min-height: 200px;
    border-radius: 15px;
    overflow: hidden;

    .empty-tab {
      @include ftva-subtitle-1;
      color: var(--subtitle-grey);
      padding: 100px 0;
      text-align: center;
    }
  }

  .mobile-remove-filters {
    margin-top: 20px;
    margin-bottom: 20px;
  }
}

.code-header {
  background-color: #f5f5f5;
  padding: 10px;
  cursor: pointer;
  font-family: Arial, sans-serif;
  font-weight: bold;
}

.code-header:hover {
  background-color: #e0e0e0;
}

.code-body {
  background-color: #272822;
  color: #f8f8f2;
  padding: 15px;
  font-family: "Courier New", Courier, monospace;
  white-space: pre;
}

@import 'assets/styles/listing-pages.scss';
</style>
