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
      >
      </SectionWrapper>

      <!-- EVENT SERIES LIST -->
      <SectionWrapper theme="paleblue">
        <!-- TAB TOGGLE -->
        <div class="wrapper">
          <tab-list alignment="center">
            <tab-item
              title="Past Series"
              icon="icon-calendar"
              :content="text1"
            />

            <tab-item
              title="Current and Upcoming Series"
              icon="icon-list"
              :content="text2"
            />
          </tab-list>
        </div>

        <div class="one-column">
          <SectionStaffArticleList
            v-if="parsedEventSeries.length > 0"
            :items="parsedEventSeries"
          />
          <p v-else-if="noResultsFound">
            No events found for this series.
          </p>
          <p v-else>
            Loading...
          </p>
        </div>
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

/* CENTER SECTION WRAPPER */
.page-event-series {
  position: relative;
  /* background-color: var(--pale-blue); */

  :deep(.section-wrapper) {
    /* background-color: var(--pale-blue); */

    /* >.section-header {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-content: center;
      align-items: center;
      text-align: center;
      max-width: 687px;

      >.section-title {
        color: #191919;
      }

      .section-summary {
        color: var(--body-grey);
      }
    }

    .section-staff-article-list {
      background: var(--color-white);
      padding: 45px;

      :deep(.container) {
        max-width: 100%;
      } */

    /* :deep(.block-staff-article-item) {
        border-bottom: 1px solid var(--pale-blue);
        padding: 40px 0;
        margin-bottom: 0;
      }

      :deep(.block-staff-article-item:first-child) {
        padding-top: 0;
      }

      :deep(.block-staff-article-item:last-child) {
        border-bottom: 0;
        padding-bottom: 0;
      }
    } */
  }

  .events {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;

  }

  :deep(.tab-list-body) {
    margin-top: 0;
    padding: 0;
  }
}
</style>
