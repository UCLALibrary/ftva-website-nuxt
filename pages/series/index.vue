<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// COMPONENTS
import { DividerWayFinder, SectionStaffArticleList } from 'ucla-library-website-components'

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
</script>

<template>
  <main class="page-events">
    <div class="one-column">
      <h2>Series Events</h2>
      <div>Select a view to explore series events.</div>
    </div>

    <!-- Tabs for View Selection -->
    <div class="tab-container">
      <nuxt-link
        :to="parsedCurrentSeriesURL"
        :class="{ active: currentView === 'current' }"
        @click.prevent="router.push({ query: { ...route.query, view: 'current', page: 1 } })"
      >
        Current Series
      </nuxt-link>
      <nuxt-link
        :to="parsedUpcomingSeriesURL"
        :class="{ active: currentView === 'upcoming' }"
        @click.prevent="currentView = 'upcoming'"
      >
        Upcoming Series
      </nuxt-link>
      <nuxt-link
        :to="parsedPastSeriesURL"
        :class="{ active: currentView === 'past' }"
        @click.prevent="currentView = 'past'"
      >
        Past Series
      </nuxt-link>
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
