<script setup>
// COMPONENTS
import { SectionWrapper } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'
import { parseISO } from 'date-fns'

// UTILS
import parseFilters from '@/utils/parseFilters'
import { getEventFilterLabels } from '~/utils/getEventFilterLabels'

// GQL
// TODO Add new query to fetch title and summary for this template from Craft singles check ticket APPS-3050

/* const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('event-list', async () => {
  const data = await $graphql.default.request(FTVAEventList)
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entries) {
  // console.log('no data')
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
} */

// const page = ref(_get(data.value, 'entries[0]', {}))

const events = ref([]) // Add typescript
const userFilterSelection = ref({}) // Add typescript and should we have separate filters ref for date and eventFilters
const userDateSelection = ref([])
const userViewSelection = ref('list')
const documentsPerPage = 10
const totalPages = ref(0)
const currentPage = ref(1)
const route = useRoute()
const noResultsFound = ref(false)
// This watcher is called when router pushes updates the query params
watch(
  () => route.query,
  (newVal, oldVal) => {
    userFilterSelection.value = parseFilters(route.query.filters || '')
    currentPage.value = route.query.page ? parseInt(route.query.page) : 1
    userViewSelection.value = route.query.view || 'list'
    console.log('route.query.dates', route?.query?.dates)
    userDateSelection.value = parseDateFromURL(route.query.dates || [])
    console.log('userDateSelection.value', userDateSelection.value)
    searchES()
  }, { deep: true, immediate: true }
)

function parseDateFromURL(datesParam) {
  console.log('datesParam', datesParam)
  if (datesParam.length === 0) return ''
  return datesParam.split(',')
}

// ELASTIC SEARCH FUNCTION
async function searchES() {
  let results = {}
  if (userViewSelection.value === 'list') {
    const { paginatedSearchFilters } = useListSearchFilter()
    results = await paginatedSearchFilters(currentPage.value, documentsPerPage.value, 'ftvaEvent', userFilterSelection.value, userDateSelection.value, 'startDate', 'asc')
  } else {
    //  Calendar View code
    const { paginatedSearchFilters } = useCalendarSearchFilter()
    results = await paginatedSearchFilters('ftvaEvent', userFilterSelection.value, userDateSelection.value, 'startDate', 'asc')
  }

  if (results && results.hits && results.hits.total.value > 0) {
    // console.log('Search ES HITS,', results.hits.hits)
    const totalDocuments = results.hits.total.value
    events.value = results.hits.hits
    totalPages.value = Math.ceil(totalDocuments / documentsPerPage)
    noResultsFound.value = false
  } else {
    noResultsFound.value = true
    events.value = []
    totalPages.value = 0
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
      tagLabels: getEventFilterLabels(obj._source),
      to: `/${obj._source.uri}`,
      image: isImageExists(obj) ? parsedImage(obj)[0]?.image[0] : null
    }
  })
})

// SEARCH
const searchFilters = ref([])

function transformEsResponseToFilterGroups(aggregations) {
  // Initialize the filterGroups array
  const filterGroups = []

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

// fetch filters for the page from ES after page loads in Onmounted hook on the client side
async function setFilters() {
  const searchAggsResponse = await useIndexAggregator()
  console.log('Search Aggs Response: ' + JSON.stringify(searchAggsResponse))
  // Transform the response
  searchFilters.value = transformEsResponseToFilterGroups(searchAggsResponse)
  console.log('searchFilters', searchFilters.value)
}

const dateListDateFilter = ref([])

const parsedInitialDates = computed(() => {
  const initialDates = {
    startDate: null,
    endDate: null
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
onMounted(async () => {
  await setFilters()
  const { allEvents } = useDateFilterQuery()
  /* const testFilters = {
    'ftvaEventTypeFilters.title.keyword': ['Guest speaker', '35mm'],
    'ftvaScreeningFormatFilters.title.keyword': ['DCP', 'Film'],
  } */
  // Logic to fetch all events startDates formated for DateFilter
  const esOutput = await allEvents('ftvaEvent', ['startDate'])
  console.log(esOutput.hits.total.value)
  if (esOutput.hits.total.value === 0) dateListDateFilter.value = []
  dateListDateFilter.value = esOutput.hits.hits.map(event => event.fields.formatted_date[0])
})

// TODO write a ticket to make tabs items links so users cn bookmark the calendar and list view
const parsedListViewURL = computed(() => {
  const queryParams = new URLSearchParams({ ...route.query, view: 'list' })
  return `${route.path}?${queryParams.toString()}`
})
const parsedCalendarViewURL = computed(() => {
  const queryParams = new URLSearchParams({ ...route.query, view: 'calendar' })
  return `${route.path}?${queryParams.toString()}`
})

// This is event handler which is invoked by datefilter component selections
function applyDateFilterSelectionToRouteURL(data) {
  console.log('Data from Date filters', data)

  // Function to format date to yyyy-MM-dd
  const formatDate = (date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0') // Months are 0-based
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Format the dates
  const startDate = formatDate(data.startDate)
  const endDate = formatDate(data.endDate)

  // Combine into a single query parameter
  const datesParam = `${startDate},${endDate}`
  const filters = []
  for (const key in userFilterSelection.value) {
    if (userFilterSelection.value[key].length > 0) {
      filters.push(`${key}:(${userFilterSelection.value[key].join(' OR ')})`)
    }
  }

  // Use router.push to navigate with query params
  useRouter().push({
    path: '/events',
    query: {
      dates: datesParam,
      filters: filters.join(' AND '),
      view: userViewSelection.value
    }
  })
}

// This is event handler which is invoked by dropdownfilters component selections
function applyEventFilterSelectionToRouteURL(data) {
  // Use router.push to navigate with query params
  const filters = []
  for (const key in data) {
    if (data[key].length > 0) {
      filters.push(`${key}:(${data[key].join(' OR ')})`)
    }
  }
  useRouter().push({
    path: '/events',
    query: {
      dates: userDateSelection.join(','),
      filters: filters.join(' AND '),
      view: userViewSelection.value
    }
  })
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
    <div class="one-column">
      <h2> Craft Title Upcoming Events</h2>
      <div> Craft Summary Text </div>
    </div>

    <div>
      <date-filter
        :key="dateListDateFilter"
        :event-dates="dateListDateFilter"
        :initial-dates="parsedInitialDates"
        @input-selected="applyDateFilterSelectionToRouteURL"
      />
      <!-- Sample way to add DropdownFilter component -->
      <!--DropdownFilter
        :filterGroups="searchFilters"
        :selectedFilters="userFilterSelection"
        @input-selected="applyEventFilterSelectionToRouteURL"
      /-->
    </div>
    <div class="full-width">
      <SectionWrapper theme="paleblue">
        <TabList
          alignment="right"
          :initial-tab="parseViewSelection"
        >
          <TabItem
            title="List View"
            class="tab-content"
            :to="parsedListViewURL"
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
                class="pagination-ucla"
                :pages="totalPages"
                :initial-current-page="currentPage"
              />
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

          <TabItem
            title="Calendar View"
            class="tab-content"
            :to="parsedCalendarViewURL"
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
      </SectionWrapper>
    </div>
  </main>
</template>

<style scoped>
.page-events {
  position: relative;

  .full-width {
    width: 100%;
    background-color: var(--pale-blue);
    margin: 0 auto;

    /*.section-wrapper.theme-paleblue {
      background-color: var(--pale-blue);
    }*/
    .pagination-ucla {
      margin-top: 20px;
    }
  }

  :deep(.tab-list-body) {
    background: none;
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
