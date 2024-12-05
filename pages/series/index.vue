<script setup>
// COMPONENTS
import { DividerWayFinder, SectionStaffArticleList } from 'ucla-library-website-components'

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
      />
      <SectionWrapper>
        <DividerWayFinder />
      </SectionWrapper>

      <SectionWrapper>
        <div class="one-column">
          <SectionStaffArticleList :items="parsedEventSeries" />
        </div>
      </SectionWrapper>

      <!-- PAGINATION -->
    </div>
  </div>
</template>

<style scoped>
@import 'assets/styles/listing-pages.scss';

.page-event-series {
  position: relative;
  background-color: var(--pale-blue);

  :deep(.section-wrapper) {
    background-color: var(--pale-blue);

    >.section-header {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-content: center;
      align-items: center;

      >.section-title {
        color: #191919;
      }

      .section-summary {
        color: var(--body-grey);
        margin-bottom: var(--space-xl);
      }
    }
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
