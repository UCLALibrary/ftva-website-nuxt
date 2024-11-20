<script setup>
// COMPONENTS
import { DividerGeneral, SectionWrapper } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// UTILS
import parseFilters from '@/utils/parseFilters'
import { getEventFilterLabels } from '~/utils/getEventFilterLabels'

// GQL
// TODO Add new query to fetch title and summary for this template from Craft singles check ticket APPS-3050

/*const { $graphql } = useNuxtApp()

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
}*/

// const page = ref(_get(data.value, 'entries[0]', {}))

const events = ref([]) // Add typescript
const searchfilters = ref({}) // Add typescript and should we have separate filters ref for date and eventFilters
const documentsPerPage = 10
const totalPages = ref(0)
const currentPage = ref(1)
const route = useRoute()
const noResultsFound = ref(false)
// This watcher is called when router pushes updates the query params
watch(
  () => route.query,
  (newVal, oldVal) => {

    searchfilters.value = parseFilters(route.query.filters || '')
    currentPage.value = route.query.page ? parseInt(route.query.page) : 1
    searchES()
  }, { deep: true, immediate: true }
)


// ELASTIC SEARCH FUNCTION
async function searchES() {
  const { paginatedSearchFilters } = useSearchFilter()
  const results = await paginatedSearchFilters(currentPage.value, documentsPerPage.value, 'ftvaEvent', searchfilters.value, [], 'startDate', 'asc')

  if (results && results.hits && results.hits.total.value > 0) {
    // console.log('Search ES HITS,', results.hits.hits)
    const totalDocuments = results.hits.total.value
    events.value = results.hits.hits
    totalPages.value = Math.ceil(totalDocuments / documentsPerPage);
    noResultsFound.value = false
  } else {
    noResultsFound.value = true
    events.value = []
    totalPages.value = 0
  }

}

const parsedEvents = computed(() => {
  if (events.value.length == 0) return []
  return events.value.map((obj) => {
    return {
      ...obj._source,
      tagLabels: getEventFilterLabels(obj._source),
      to: `/${obj._source.uri}`,
      image: obj._source.image && obj._source.image.length > 0 ? obj._source.image[0] : null
    }
  })
})

const parsedDateList = computed(() => {
  if (events.value.length == 0) return []
  return events.value.map(event => event.fields.formatted_date[0]);


})




// SEARCH
const searchFilters = ref([])




// fetch filters for the page from ES after page loads in Onmounted hook on the client side
async function setFilters() {
  const searchAggsResponse = await useIndexAggregator()

  console.log('Search Aggs Response: ' + JSON.stringify(searchAggsResponse))
  // TODO format the data as needed for the Date Filter and Filter drop down components
  searchFilters.value = searchAggsResponse
}



onMounted(async () => {
  await setFilters()
  const { paginatedSearchFilters } = useSearchFilter()
  const testFilters = {
    'ftvaEventTypeFilters.title.keyword': ['Guest speaker', '35mm'],
    'ftvaScreeningFormatFilters.title.keyword': ['DCP', 'Film'],
  }

  const esOutput = await paginatedSearchFilters(currentPage.value, documentsPerPage.value, 'ftvaEvent', testFilters, ['2000-03-08', '2029-03-08'], 'startDate', 'asc')
  console.log(esOutput.hits.total.value)
})

// Delete following lines once SectionPagination working as expected

const visiblePages = computed(() => {
  // Calculate the range of page numbers to display
  const maxPages = 10;
  const startPage = Math.max(1, currentPage.value - Math.floor(maxPages / 2));
  const endPage = Math.min(totalPages.value, startPage + maxPages - 1);

  return Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  )
})

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
      <date-filter :eventDates="parsedDateList" /> <!-- Add prop initial dates from the URl-->
    </div>
    <div class="full-width">
      <SectionWrapper theme="paleblue">
        <TabList alignment="right">
          <TabItem
            title="List View"
            class="tab-content"
            :to="parsedListViewURL"
          >
            <template v-if="parsedEvents && parsedEvents.length > 0">
              <!-- :n-shown="10"  this prop does not do anything if theme is ftva-->
              <SectionTeaserList
                :items="parsedEvents"
                component-name="BlockCardThreeColumn"
                nShown="10"
                class="tabbed-event-list"
              />
            </template>
            <template v-else>
              <p
                class="empty-tab"
                v-if="noResultsFound"
              >
                There are no events found
              </p>
              <p
                class="empty-tab"
                v-else
              >
                Search in progress ...
              </p>
            </template>
          </TabItem>

          <TabItem
            title="Calendar View"
            class="tab-content"
            :to="parsedCalendarViewURL"
          >
            <template v-if="parsedEvents && parsedEvents.length > 0">
              <h3>Calendar View</h3>
              <code> {{ parsedEvents }} </code>
            </template>
            <template v-else>
              <p
                class="empty-tab"
                v-if="noResultsFound"
              >
                There are no events found
              </p>
              <p
                class="empty-tab"
                v-else
              >
                Search in Progress ...
              </p>
            </template>
          </TabItem>
        </TabList>
      </SectionWrapper>
      <div>{{ currentPage }}</div>
      <SectionWrapper>
        <!-- Pagination -->
        <div
          class="pagination"
          v-if="totalPages > 1"
        >
          <!-- Previous Link -->
          <nuxt-link
            :to="{ query: { ...$route.query, page: currentPage - 1 } }"
            class="prev-btn"
            :class="{ disabled: currentPage === 1 }"
            v-if="currentPage > 1"
          >
            Previous
          </nuxt-link>

          <!-- Page Number Links -->
          <ul class="page-links">
            <li
              v-for="page in visiblePages"
              :key="page"
              :class="{ active: page === currentPage }"
            >
              <nuxt-link :to="{ query: { ...$route.query, page } }">
                {{ page }}
              </nuxt-link>
            </li>
          </ul>

          <!-- Next Link -->
          <nuxt-link
            :to="{ query: { ...$route.query, page: currentPage + 1 } }"
            class="next-btn"
            :class="{ disabled: currentPage === totalPages }"
            v-if="currentPage < totalPages"
          >
            Next
          </nuxt-link>
        </div>
      </SectionWrapper>
      <SectionWrapper>
        <section-pagination
          :pages="totalPages"
          :initialCurrentPage="currentPage"
        />
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

/*
Remove the following css later
*/
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
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
  text-decoration: none;
  padding: 0.5em 1em;
  border-radius: 4px;
  background: #f0f0f0;
}

.page-links .active a {
  font-weight: bold;
  color: #fff;
  background-color: #007acc;
}

.prev-btn,
.next-btn {
  padding: 0.5em 1em;
  background-color: #007acc;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.prev-btn.disabled,
.next-btn.disabled {
  pointer-events: none;
  background-color: #ccc;
}

@import 'assets/styles/listing-pages.scss';
</style>
