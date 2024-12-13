<script setup>
// COMPONENTS
import { DividerWayFinder, SectionStaffArticleList, SectionPagination } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAEventSeriesList from '../gql/queries/FTVAEventSeriesList.gql'

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

const heading = ref(_get(data.value, 'entry', {}))

const page = ref(_get(data.value, 'entries', {}))

// // EVENTS WITH GQL DATA
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
</script>

<template>
  <div class="page page-event-series">
    <div class="full-width">
      <SectionWrapper
        class="header"
        :section-title="heading.titleGeneral"
        :section-summary="heading.summary"
        theme="paleblue"
      />

      <SectionWrapper theme="paleblue">
        <TabList alignment="center">
          <TabItem
            title="Past Series"
            class="tab-content"
          >
            <template v-if="parsedEventSeries.length > 0">
              <SectionStaffArticleList :items="parsedEventSeries" />
            </template>
          </TabItem>

          <TabItem
            title="Current and Upcoming Series"
            class="tab-content"
          >
            <template v-if="parsedEventSeries.length > 0">
              <SectionStaffArticleList :items="parsedEventSeries" />
            </template>
          </TabItem>
        </TabList>
      </SectionWrapper>

      <!-- PAGINATION -->
      <section-pagination
        v-if="totalPages !== 1"
        class="pagination-ucla"
        :pages="totalPages"
        :initial-current-page="currentPage"
      />
    </div>
  </div>
</template>

<style scoped>
@import 'assets/styles/listing-pages.scss';

.page-event-series {
  position: relative;
  background-color: var(--pale-blue);

  .header {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-content: center;
    align-items: center;
    text-align: center;

    max-width: 787px;
  }

  :deep(.tab-list .tab-list-header) {
    margin-top: -50px;
    margin-bottom: 50px;
  }
}
</style>
