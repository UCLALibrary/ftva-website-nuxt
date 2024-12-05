<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// COMPONENTS
import { DividerWayFinder, SectionWrapper, SectionStaffArticleList } from 'ucla-library-website-components'

// COMPOSABLE
import useEventSeriesFilter from '@/composables/useEventSeriesFilter'

const route = useRoute()
const router = useRouter()

const events = ref([])
// currentView is default view
const currentView = ref('current')
const currentPage = ref(1)
const totalPages = ref(0)
const documentsPerPage = 10
const noResultsFound = ref(false)
const sectionHandle = ref('ftvaEventSeries')

// ELASTIC SEARCH FUNCTION
// Fetch events from Elasticsearch based on the current view
async function searchES() {
  const { paginatedEventSeriesFilters } = useEventSeriesFilter()

  const dateRange = getDateRangeForView(currentView.value)
  const filters = {}

  const results = await paginatedEventSeriesFilters(
    currentPage.value,
    documentsPerPage,
    'ftvaEvent',
    filters,
    dateRange,
    sectionHandle,
    { source: ['*'] }, // Default value
    'startDate',
    currentView.value === 'past' ? 'desc' : 'asc' // Sort past events descending, others ascending
  )

  if (results?.hits?.total?.value > 0) {
    const totalDocuments = results.hits.total.value
    events.value = results.hits.hits.map(hit => hit._source)
    totalPages.value = Math.ceil(totalDocuments / documentsPerPage)
    noResultsFound.value = false
  } else {
    events.value = []
    totalPages.value = 0
    noResultsFound.value = true
  }
}

// Define date ranges based on the view type
function getDateRangeForView(view) {
  const today = new Date().toISOString()
  if (view === 'past') {
    return { endDate: today }
  } else if (view === 'upcoming') {
    return { startDate: today }
  }
  return {} // Default for "current" (no date filter)
}

// Watch for query parameter or view changes
watch(
  () => route.query,
  async () => {
    currentPage.value = route.query.page ? parseInt(route.query.page, 10) : 1
    await searchES()
  },
  { immediate: true }
)

watch(
  currentView,
  async () => {
    currentPage.value = 1 // Reset to first page when the view changes
    await searchES()
  },
  { immediate: true }
)

// Pagination computation
onMounted(searchES)
const visiblePages = computed(() => {
  const maxPages = 10
  const startPage = Math.max(1, currentPage.value - Math.floor(maxPages / 2))
  const endPage = Math.min(totalPages.value, startPage + maxPages - 1)

  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
})

// Tab URLs
const parsedCurrentSeriesURL = computed(() => {
  const queryParams = new URLSearchParams({ ...route.query, view: 'current', page: 1 })
  return `${route.path}?${queryParams.toString()}`
})
const parsedUpcomingSeriesURL = computed(() => {
  const queryParams = new URLSearchParams({ ...route.query, view: 'upcoming', page: 1 })
  return `${route.path}?${queryParams.toString()}`
})
const parsedPastSeriesURL = computed(() => {
  const queryParams = new URLSearchParams({ ...route.query, view: 'past', page: 1 })
  return `${route.path}?${queryParams.toString()}`
})

// EVENTS with ES data
const parsedEventSeries = computed(() => {
  if (events.value.length === 0) return []

  return events.value.map((obj) => {
    return {
      ...obj._source,
      tagLabels: getEventFilterLabels(obj._source),
      to: `/${obj._source.to}`,
      description: obj._source.description,
      startDate: obj._source.startDate,
      endDate: obj._source.endDate,
      ongoing: obj._source.ongoing,
      image: obj._source.image && obj._source.image.length === 1 ? obj.image[0] : null, // craft data has an array, but component expects a single object for image
    }
  })
})

// // EVENTS WITH GQL DATA
// const parsedEventSeries = computed(() => {
//   return page.value.map((obj) => {
//     return {
//       ...obj,
//       to: obj.to,
//       description: obj.description,
//       startDate: obj.startDate,
//       endDate: obj.endDate,
//       ongoing: obj.ongoing,
//       image: obj.image && obj.image.length === 1 ? obj.image[0] : null, // craft data has an array, but component expects a single object for image
//     }
//   })
// })
</script>

<template>
  <main
    id="main"
    class="page page-events"
  >

    <div class="full-width">
      <SectionWrapper theme="paleblue">
        <div class="one-column">
          <h2>Series Events</h2>
          <div>Select a view to explore series events.</div>
        </div>

        <!-- Tabs for View Selection -->
        <TabList alignment="right">
          <TabItem
            title="Current Series"
            class="tab-content"
            :to="parsedCurrentSeriesURL"
          >
            <template v-if="parsedCurrentSeriesURL && parsedCurrentSeriesURL.length > 0">

              <SectionStaffArticleList
                :items="parsedCurrentSeriesURL"
                component-name="BlockStaffArticleList"
                :n-shown="10"
                class="tabbed-event-list"
              />
            </template>

            <template v-else-if="parsedUpcomingSeriesURL && parsedUpcomingSeriesURL.length > 0">

              <SectionStaffArticleList
                :items="parsedUpcomingSeriesURL"
                component-name="BlockStaffArticleList"
                :n-shown="10"
                class="tabbed-event-list"
              />
            </template>

            <template v-else-if="parsedPastSeriesURL && parsedPastSeriesURL.length > 0">

              <SectionStaffArticleList
                :items="parsedPastSeriesURL"
                component-name="BlockStaffArticleList"
                :n-shown="10"
                class="tabbed-event-list"
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
                Search in progress ...
              </p>
            </template>
          </TabItem>
        </TabList>
    </div>

    <!-- Series List -->
    <div class="series-list">
      <SectionStaffArticleList
        v-if="events.length > 0"
        :items="events"
      />
      <p v-else-if="noResultsFound">
        No events found for this series.
      </p>
      <p v-else>
        Loading...
      </p>
    </div>

    </SectionWrapper>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="pagination"
    >
      <!-- Previous Button -->
      <nuxt-link
        v-if="currentPage > 1"
        :to="{ query: { ...route.query, page: currentPage - 1 } }"
        class="prev-btn"
      >
        Previous
      </nuxt-link>

      <!-- Page Numbers -->
      <ul class="page-links">
        <li
          v-for="page in visiblePages"
          :key="page"
          :class="{ active: page === currentPage }"
        >
          <nuxt-link :to="{ query: { ...route.query, page } }">
            {{ page }}
          </nuxt-link>
        </li>
      </ul>

      <!-- Next Button -->
      <nuxt-link
        v-if="currentPage < totalPages"
        :to="{ query: { ...route.query, page: currentPage + 1 } }"
        class="next-btn"
      >
        Next
      </nuxt-link>
    </div>
  </main>
</template>

<style scoped>
.page-events {
  .tab-container {
    display: flex;
    justify-content: center;
    gap: 1em;
    margin-bottom: 1em;
  }

  .tab-container a {
    padding: 0.5em 1em;
    border-radius: 4px;
    text-decoration: none;
    background-color: #f0f0f0;
    color: #007acc;
  }

  .tab-container a.active {
    font-weight: bold;
    background-color: #007acc;
    color: white;
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 2em;
  }

  .page-links {
    list-style: none;
    display: flex;
    padding: 0;
    margin: 0 1em;
  }

  .page-links li {
    margin: 0 0.5em;
  }

  .page-links a {
    padding: 0.5em 1em;
    border-radius: 4px;
    text-decoration: none;
    background: #f0f0f0;
  }

  .page-links .active a {
    font-weight: bold;
    background-color: #007acc;
    color: #fff;
  }
}
</style>
