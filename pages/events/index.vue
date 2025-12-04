<script setup lang="ts">
// HELPERS
import _get from 'lodash/get'
import { parseISO } from 'date-fns'
import { useElementBounding } from '@vueuse/core'

import FTVAEventList from '../gql/queries/FTVAEventList.gql'

import useMobileOnlyInfiniteScroll from '@/composables/useMobileOnlyInfiniteScroll'

// UTILS
import getEventFilterLabels from '@/utils/getEventFilterLabels'
import parseFilters from '@/utils/parseFilters'
import parseImage from '@/utils/parseImage'

// GQL
const { $graphql } = useNuxtApp()
const { data, error } = await useAsyncData('event-list', async () => {
  const data: any = await $graphql.default.request(FTVAEventList)
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

// METADATA INFO
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    const doc = {
      title: data.value.entry.titleGeneral,
      titleSort: normalizeTitleForAlphabeticalBrowseBy(data.value.entry.titleGeneral),
      text: data.value.entry.summary,
      uri: '/events',
      sectionHandle: data.value.entry.sectionHandle,
      groupName: 'Events',
      postDate: data.value.entry.startDate,
    }
    // Index the events data using the composable during static build
    await indexContent(doc, 'event-listing')
    // console.log('Events indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX EVENT LISTING during static build:', error)
  }
}

const heading = ref(_get(data.value, 'entry', {}))

useHead({
  title: heading.value ? heading.value.titleGeneral : '... Loading',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: removeTags(heading.value.summary)
    }
  ]
})

// PREVIEW WATCHER
watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  heading.value = _get(newVal, 'entry', {})
})

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

// FILTERS
// userFilterSelection is used by FilterDropdown component to display selected filters, but also update selected items in filter groups; therefore, it MUST always have a key for each filter group in the dropdown, even if the value is an empty array
const userFilterSelection = ref<FilterItem>({ 'ftvaEventTypeFilters.title.keyword': [], 'ftvaScreeningFormatFilters.title.keyword': [] })
const userDateSelection = ref<string[]>([])
const allFilters = ref<FilterItem>({})
const userViewSelection = ref<string>('list')

// "STATE"
const documentsPerPage = 10
const noResultsFound = ref<boolean>(false)

const eventFetchFunction = async () => {
  const page = currentPage.value
  const size = 10
  let results: any = {}

  if (userViewSelection.value === 'list') {
    const { paginatedSearchFilters } = useListSearchFilter()
    results = await paginatedSearchFilters(page, size, 'ftvaEvent', userFilterSelection.value, userDateSelection.value, 'startDate', 'asc')
  } else {
    //  Calendar View code
    const { paginatedSearchFilters } = useCalendarSearchFilter()
    results = await paginatedSearchFilters('ftvaEvent', userFilterSelection.value, userDateSelection.value, 'startDate', 'asc')
  }
  return results
}

const onResults = (results) => {
  if (results && results.hits && results?.hits?.hits?.length > 0) {
    const newEvents = results.hits.hits || []

    if (isMobile.value) {
      mobileItemList.value.push(...newEvents)
      hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
    } else {
      desktopItemList.value = newEvents
      totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)
    }
    noResultsFound.value = false
  } else {
    noResultsFound.value = true
    if (!isMobile.value) totalPages.value = 0
    hasMore.value = false
  }
}

// INFINITE SCROLL
const { isLoading, isMobile, hasMore, desktopItemList, mobileItemList, totalPages, currentPage, currentList, scrollElem, searchES } = useMobileOnlyInfiniteScroll(eventFetchFunction, onResults)

// STICKY FILTERS HANDLING
const sectionTeaserListElem = ref(null) // Element intersection target to unstick filters
const makeFiltersSticky = ref(false)
const { bottom } = useElementBounding(sectionTeaserListElem)

watch(bottom, (newBottom) => {
  // On mobile, when bottom of SectionTeaserList is less than 250px away
  // from the top edge of the viewport, unstick the filters

  if ((isMobile.value && bottom.value <= 250)) {
    makeFiltersSticky.value = false
  } else if (isMobile.value) {
    makeFiltersSticky.value = true
  } else {
    makeFiltersSticky.value = false
  }
}, { immediate: true })

const stickyClass = computed(() => {
  return makeFiltersSticky.value ? 'is-sticky' : ''
})

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
const route = useRoute()
const router = useRouter()

const isMobileCalendarView = () =>
  typeof window !== 'undefined' && window.innerWidth < 751

onMounted(() => {
  const currentView = route.query.view

  if (isMobileCalendarView() && currentView === 'calendar') {
    router.replace({
      query: {
        ...route.query,
        view: 'list'
      }
    })
  }
})

// PAGINATION SCROLL HANDLING
// Element reference for the scroll target
const resultsSection = ref<HTMLElement>(null)
// usePaginationScroll composable
const { scrollTo } = usePaginationScroll()

watch(() => route.query, async (newVal, oldVal) => {
  isLoading.value = false

  const selectedFiltersFromRoute = parseFilters(route.query.filters || '')

  userFilterSelection.value = { 'ftvaEventTypeFilters.title.keyword': [], 'ftvaScreeningFormatFilters.title.keyword': [], ...selectedFiltersFromRoute } // ensure all filter groups are present

  currentPage.value = route.query.page ? parseInt(route.query.page as string) : 1

  userViewSelection.value = (route.query.view as string | undefined) || 'list'
  // console.log('route.query.dates', route?.query?.dates)

  userDateSelection.value = parseDateFromURL(route.query.dates as string | undefined) || []

  allFilters.value = parsedRemoveSearchFilters.value
  // console.log('userDateSelection.value', userDateSelection.value)

  isMobile.value ? mobileItemList.value = [] : desktopItemList.value = []
  hasMore.value = true
  await searchES()
  // Restore scroll position
  // // Scroll after DOM updates
  await nextTick()
  if (!isMobile.value && route.query.page && resultsSection.value && parsedEvents.value.length > 0) {
    await scrollTo(resultsSection)
  }
}, { deep: true, immediate: true })

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

// COMPUTED EVENTS
const parsedEvents = computed(() => {
  if (currentList.value.length === 0) return []
  return currentList.value.map((obj) => {
    return {
      ...obj._source,
      tagLabels: addHighlightState(getEventFilterLabels(obj._source)),
      to: `/${obj._source.uri}`,
      image: parseImage(obj),
      category: obj._source.eventSeriesTitle ? obj._source.eventSeriesTitle : null
    }
  })
})

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

function transformEsResponseToFilterGroups(aggregations: Aggregations): FilterGroup[] {
  // Initialize the filterGroups array
  const filterGroups: FilterGroup[] = []

  // Define the desired order of display
  const keyOrder = ['Event Type', 'Screening Format']

  // Iterate over the desired order and compare to aggregations in the Elasticsearch response
  for (const key of keyOrder) {
    const value = aggregations[key]
    if (!value) continue

    // Extract the bucket keys as options
    const options = value.buckets.map(bucket => bucket.key)

    // Map the key to the appropriate searchField
    let searchField
    if (key === 'Event Type') {
      searchField = 'ftvaEventTypeFilters.title.keyword'
    } else if (key === 'Screening Format') {
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
  desktopItemList.value = []
  mobileItemList.value = []
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
      eventFilters.push(`${key}:(${userFilterSelection.value[key].join(',')})`)
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
  desktopItemList.value = []
  mobileItemList.value = []

  const eventFilters = []
  for (const key in data) {
    if (data[key].length > 0) {
      eventFilters.push(`${key}:(${data[key].join(',')})`)
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
  desktopItemList.value = []
  mobileItemList.value = []

  let dateFilters = ''
  // console.log('applyChangesToSearch allFilters.value', allFilters.value)
  // separate dates and event filters
  for (const key in allFilters.value) {
    if (allFilters.value[key].length > 0) {
      if (key !== 'dates')
        eventFilters.push(`${key}:(${allFilters.value[key].join(',')})`)
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

const pageClasses = computed(() => {
  return ['page', 'page-events', 'page-bottom-spacer']
})
</script>

<template>
  <main
    id="main"
    :class="pageClasses"
  >
    <div class="full-width">
      <SectionWrapper
        :level="1"
        class="header"
        theme="paleblue"
        :section-title="heading.titleGeneral"
      />
      <div
        ref="resultsSection"
        class="for-pagination-scroll"
      />
      <SectionWrapper
        ref="scrollElem"
        class="main"
        theme="paleblue"
      >
        <TabList
          :key="parseViewSelection"
          :class="stickyClass"
          alignment="right"
          :initial-tab="parseViewSelection"
        >
          <template #filters>
            <div class="filters-wrapper">
              <date-filter
                :key="dateListDateFilter"
                :event-dates="dateListDateFilter"
                :initial-dates="parsedInitialDates"
                data-test="date-filter"
                @input-selected="applyDateFilterSelectionToRouteURL"
              />
              <filters-dropdown
                v-model:selected-filters="userFilterSelection"
                :filter-groups="searchFilters"
                data-test="filters-dropdown"
                @update-display="applyEventFilterSelectionToRouteURL"
              />
            </div>
            <section-remove-search-filter
              v-if="Object.keys(allFilters).length > 0"
              :filters="allFilters"
              class="remove-filters"
              @update:filters="handleFilterUpdate"
              @remove-selected="applyChangesToSearch"
            />
          </template>

          <TabItem
            title="List View"
            class="tab-content"
            data-test="list-view"
          >
            <template v-if="parsedEvents && parsedEvents.length > 0">
              <SectionTeaserList
                ref="sectionTeaserListElem"
                :items="parsedEvents"
                component-name="BlockCardThreeColumn"
                :n-shown="parsedEvents.length"
                class="tabbed-event-list"
                data-test="tabbed-content"
              />
              <section-pagination
                v-if="totalPages !== 1 && !isMobile"
                :pages="totalPages"
                :initial-current-page="currentPage"
              />
            </template>
            <template v-else>
              <p
                v-if="noResultsFound"
                class="empty-tab"
              >
                There are no events matching the selected filters
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
            data-test="calendar-view"
          >
            <template v-if="!isMobile && parsedEvents && parsedEvents.length > 0">
              <div style="display: flex;justify-content: center;">
                <base-calendar
                  :events="parsedEvents"
                  :first-event-month="parseFirstEventMonth"
                />
              </div>
              <br>
              <br>
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

<style lang='scss' scoped>
@import 'assets/styles/listing-pages.scss';

:deep(.button-dropdown-modal-wrapper.is-expanded) {
  z-index: 1000;
}

.page-events {
  position: relative;
  background-color: var(--pale-blue);

  .section-wrapper:last-of-type {
    padding-bottom: 0;
  }

  .header {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-content: center;
    align-items: center;
    text-align: center;
    max-width: 787px;
    padding-top: var(--space-2xl);
    padding-bottom: 0;
  }

  .header :deep(.section-title) {
    line-height: 1;
    margin-bottom: var(--space-l);
    @include ftva-wrapper-title;
  }

  .main {
    padding-top: var(--space-xl);
  }

  .full-width {
    width: 100%;
    background-color: var(--pale-blue);
    margin: 0 auto;
  }

  :deep(.tab-list-header) {
    align-self: self-start;
  }

  :deep(.tab-list-body) {
    background: none;
    margin-top: 0;
  }

  :deep(.tab-list.right) {
    justify-content: space-between;
    width: 100%;
    padding-bottom: 20px;

    .filters {
      flex-basis: 65%;
    }
  }

  :deep(.tab-list) {
    &.is-sticky {
      position: static;
      /* Default position */
    }
  }

  .filters-wrapper {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .date-filter {
    flex: 1;
    width: 100%;

    :deep(.vue-date-picker) {
      width: 100%;

      .dp__menu {
        min-width: unset;
      }

      .dp__outer_menu_wrap.dp--menu-wrapper {
        left: 0 !important;
        top: 54px !important;
        width: 100%;
      }

      .dp__input {
        height: 52px;
      }

      .custom-header {
        font-size: 20px;

        .custom-nav-buttons .today-button {
          font-size: 14px;
          width: 60px;
        }
      }
    }
  }

  .filters-dropdown {
    flex: 1;
    width: 100%;

    :deep(.mobile-button) {
      min-width: unset;
      height: 52px;
    }

    :deep(.button-dropdown-modal-wrapper.is-expanded) {
      min-width: unset;
    }
  }

  .date-filter :deep(.vue-date-picker .action-row button),
  .filters-dropdown :deep(.action-row button) {
    padding: 10px 18px;
    line-height: 15px;

    >.label {
      font-family: var(--font-secondary);
      font-size: 15px;
      line-height: 15px;
      text-transform: capitalize;
    }

    .svg__icon-close {
      height: 20px;
      width: 20px;
    }
  }

  .remove-filters {
    margin-top: 0;
    margin-bottom: 0;
    padding-top: 20px;
  }

  .tab-content {
    min-height: 200px;
    background-color: white;
    border-radius: 2px;
    overflow: hidden;

    .empty-tab {
      @include ftva-subtitle-1;
      color: var(--subtitle-grey);
      padding: 100px 0;
      text-align: center;
    }
  }

  :deep(.block-card-three-column .day) {
    color: black;
    font-family: var(--font-primary);
    font-size: 20px;
    font-weight: 500;
    line-height: normal;
    letter-spacing: 0.8px;
  }

  :deep(.block-card-three-column .meta .floating-slot) {
    flex-wrap: wrap;
    column-gap: 10px;
    row-gap: 8px;
  }

  :deep(.base-calendar) {
    max-width: 1000px;
    padding-top: 32px;

    .v-calendar-header {
      margin-bottom: 14px;
    }
  }

  :deep(.section-pagination) {
    /* TODO Move this to ftva sectionwrapper.theme.paleblue scss file */
    background-color: white;
    max-width: unset;
    justify-content: center;
    padding: 15px 2.5% 60px;
  }

  @media(min-width: 1025px) {
    :deep(.section-teaser-list) {
      padding: var(--space-xl);
    }

    :deep(.section-teaser-list .list-item) {
      border-bottom: 1px solid $page-blue;

      &:last-child {
        border-bottom: 0;
      }
    }

    :deep(.block-card-three-column) {
      gap: 45px;
    }

    :deep(.block-card-three-column .day-month-date) {
      flex: 0.7;
    }

    :deep(.block-card-three-column .card-meta) {
      padding: 0;
    }

    :deep(.block-card-three-column .meta .title) {
      font-size: 30px;
      line-height: 32px;
    }
  }

  @media(max-width: 1200px) {
    .base-calendar {
      max-width: 900px;
    }
  }

  @media(max-width: 1100px) {
    .base-calendar {
      max-width: 800px;
    }
  }

  @media #{$medium} {
    :deep(.tab-list) {
      &.is-sticky {
        position: -webkit-sticky;
        /* For Safari */
        position: sticky;
        top: 65px;
        z-index: 1000;
        background-color: var(--pale-blue);
        padding: 20px;
      }
    }

    .tab-content {
      overflow: unset;
    }

    :deep(.tab-list-header) {
      display: none;
    }

    :deep(.tab-list.right .filters) {
      flex-basis: 100%;
    }

    .date-filter {
      :deep(.vue-date-picker) {
        .dp__outer_menu_wrap.dp--menu-wrapper {
          width: 100%;
        }
      }
    }

    :deep(.block-card-three-column .image-block),
    :deep(.block-card-three-column .image-block .image) {
      aspect-ratio: 1.69 / 1;
    }

    :deep(.block-card-three-column .meta .title) {
      font-size: 26px;
    }

    :deep(.section-teaser-list .list-item) {
      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(.section-pagination) {
      padding: 2.5%;
    }
  }

  @media #{$small} {
    .date-filter {
      :deep(.vue-date-picker) {
        width: unset;

        .dp__menu {
          min-width: var(--dp-menu-min-width);
        }

        .custom-header {
          font-size: 26px;

          .custom-nav-buttons .today-button {
            font-size: 16px;
            width: 81px;
          }
        }
      }
    }

    .filters-dropdown {
      :deep(.mobile-button) {
        height: initial;
      }
    }

    .date-filter,
    .filters-dropdown {

      :deep(.dropdown-wrapper) {
        width: 100%;

        .mobile-button {
          width: 100%;
        }
      }
    }
  }
}
</style>
