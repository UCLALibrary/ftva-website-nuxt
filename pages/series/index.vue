<script setup>
// COMPONENTS
import { DividerWayFinder, SectionStaffArticleList } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAEventSeriesList from '../gql/queries/FTVAEventSeriesList.gql'

import EventSeriesTestData from '../data/eventSeriesTestData.json'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('series-list', async () => {
  const data = await $graphql.default.request(FTVAEventSeriesList)
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
}

const page = ref(_get(data.value, 'entries', {}))

const parsedEventSeries = computed(() => {
  return page.value.map((obj) => {
    return {
      ...obj,
      to: obj.to,
      description: obj.description,
      startDate: obj.startDate,
      endDate: obj.endDate,
      ongoing: obj.ongoing,
      image: obj.image && obj.image.length === 1 ? obj.image[0] : null, // craft data has an array, but component expects a single object for image
    }
  })
})

// onMounted(async () => {
//   await setFilters()
//   const { paginatedEventSeriesFilters } = useSearchFilter()
//   /* const testFilters = {
//     'ftvaEventTypeFilters.title.keyword': ['Guest speaker', '35mm'],
//     'ftvaScreeningFormatFilters.title.keyword': ['DCP', 'Film'],
//   } */
//   // Logic to fetch all events startDates formated for DateFilter

//   // first we are returning pastSeries
//   const esOutputPastSeries = await paginatedEventSeriesFilters(1, 1000, 'ftvaEventSeries', {}, ['now/d'], 'startDate', 'asc', ['startDate'])
//   // return Current & Ongoing series
//   const esOutputCurrentOngoingSeries = await paginatedEventSeriesFilters(1, 1000, 'ftvaEventSeries', {}, [], 'startDate', 'asc', ['startDate'])
//   // return Upcoming series & Ongoing series
//   const esOutputUpcomingOngoingSeries = await paginatedEventSeriesFilters(1, 1000, 'ftvaEventSeries', {}, [], 'startDate', 'asc', ['startDate'])
//   // console.log(esOutput.hits.total.value)

// })


</script>

<template>
  <div
    class="page page-events"
    style="padding: 25px 100px;"
  >
    <div class="header">
      <h2>Screening Series</h2>
      <p class="text">
        Discover the magic of our Upcoming Series, where we curate an immersive experience that transcends
        time and
        genre. From classic masterpieces to cutting-edge contemporary works, our series showcase the diverse voices and
        visions that have shaped the evolution of visual storytelling.
      </p>
    </div>

    <DividerWayFinder />

    <SectionStaffArticleList
      :items="parsedEventSeries"
      section-title="Event Series"
    />

    <!-- PAGINATION -->
  </div>
</template>

<style scoped>
.page-events {
  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    align-content: center;
    justify-content: center;
  }

  .events {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;

  }

  a {
    outline-color: transparent;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
  }

  a:link {
    color: #6900ff;
  }

  a:visited {
    color: #a5c300;
  }

  a:focus {
    text-decoration: none;
    background: #bae498;
  }

  a:hover {
    text-decoration: none;
    background: #cdfeaa;
  }

  a:active {
    background: #6900ff;
    color: #cdfeaa;
  }
}
</style>
