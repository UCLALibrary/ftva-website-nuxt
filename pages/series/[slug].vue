<script setup>
// COMPONENT RE-IMPORTS
// TODO: remove when we have implemented component library as a module
// https://nuxt.com/docs/guide/directory-structure/components#library-authors
import { BlockEventDetail, BlockInfo, BlockTag, CardMeta, DividerWayFinder, FlexibleMediaGalleryNewLightbox, NavBreadcrumb, ResponsiveImage, RichText, SectionScreeningDetails, SectionTeaserCard, SectionWrapper } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAEventSeriesDetail from '../gql/queries/FTVAEventSeriesDetail.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`ftva-event-series-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVAEventSeriesDetail, { slug: route.params.slug })
  return data
})
if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found .' + error.value, fatal: true
  })
}

if (!data.value.ftvaEventSeries) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found for ftvaEventSeries',
    fatal: true
  })
}

const page = ref(_get(data.value, 'ftvaEventSeries', {}))
const upcomingEvents = ref(_get(data.value, 'upcomingEvents', {}))
const pastEvents = ref(_get(data.value, 'pastEvents', {}))
const otherSeriesOngoing = ref(_get(data.value, 'otherSeriesOngoing', {}))
const otherSeriesUpcoming = ref(_get(data.value, 'otherSeriesUpcoming', {}))

watch(data, (newVal, oldVal) => {
  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(data.value, 'ftvaEventSeries', {})
  upcomingEvents.value = _get(newVal, 'upcomingEvents', {})
  pastEvents.value = _get(newVal, 'pastEvents', {})
  otherSeriesOngoing.value = _get(newVal, 'otherSeriesOngoing', {})
  otherSeriesUpcoming.value = _get(newVal, 'otherSeriesUpcoming', {})
})

// Get data for Image or Carousel at top of page
const parsedImage = computed(() => {
  return page.value.imageCarousel
})

// Transform data for Carousel
const parsedCarouselData = computed(() => {
  // map image to item, map creditText to credit
  return parsedImage.value.map((rawItem, index) => {
    return {
      item: [{ ...rawItem.image[0], kind: 'image' }], // Carousels on this page are always images, no videos
      credit: rawItem?.creditText,
    }
  })
})
</script>

<template>
  <main
    id="main"
    class="page page-event-series-detail"
  >
    <div class="one-column">
      <NavBreadcrumb
        class="breadcrumb"
        :title="page.title"
        to='/series'
        parentTitle="Screening Series"
      />

      <ResponsiveImage
        v-if="parsedImage.length === 1"
        :media="parsedImage[0].image[0]"
        :aspect-ratio="43.103"
      >
        <template
          v-if="parsedImage[0]?.creditText"
          #credit
        >
          {{ parsedImage[0]?.creditText }}
        </template>
      </ResponsiveImage>

      <div
        v-else
        class="lightbox-container"
      >
        <FlexibleMediaGalleryNewLightbox :items="parsedCarouselData">
          <template #default="slotProps">
            <BlockTag :label="parsedCarouselData[slotProps.selectionIndex]?.creditText" />
          </template>
        </FlexibleMediaGalleryNewLightbox>
      </div>
    </div>

    <div class="two-column">
      <div class="primary-column top">
        <SectionWrapper>
          <CardMeta
            category="Series"
            :title="page?.title"
            :text="page.eventDescription"
          />
        </SectionWrapper>
      </div>
    </div>

    <!-- <div class="full-width">
      <SectionWrapper
        v-if="parsedFtvaEventSeries && parsedFtvaEventSeries.length > 0"
        section-title="Upcoming events in this series"
        theme="paleblue"
      >
        <SectionTeaserCard
          v-if="parsedFtvaEventSeries && parsedFtvaEventSeries.length > 0"
          :items="parsedFtvaEventSeries"
        />
      </SectionWrapper>
    </div> -->

    <SectionWrapper>
      <h2>PAGE</h2>
      <pre>{{ page }}</pre>
      <hr>
      <h2>UpcomingEvents</h2>
      <pre>{{ upcomingEvents }}</pre>
      <hr>
      <h2>Past Events</h2>
      <pre>{{ pastEvents }}</pre>
      <hr>
      <h2>Other Series Ongoing</h2>
      <pre>{{ otherSeriesOngoing }}</pre>
      <hr>
      <h2>Other Series Upcoming</h2>
      <pre>{{ otherSeriesUpcoming }}</pre>
      <hr>
    </SectionWrapper>
  </main>
</template>

<style
  lang="scss"
  scoped
>
// VARS - TO DO move to global? reference tokens?
// WIDTH, HEIGHT, SPACING
$max-width: 1160px;
$banner-height: 520px;
// COLORS
$pale-blue: #E7EDF2;

// PAGE STYLES
.page-event-series-detail {
  position: relative;

  &:before {
    content: '';
    position: absolute;
    background-color: $pale-blue;
    aspect-ratio: 1440 / 520;
    max-height: 518px; //prevent overflow on large screens
    min-height: 225px; //prevent too much shrinking on small screens
    width: 100%;
    z-index: -1;
  }

  .one-column {
    width: 100%;
    max-width: $max-width;
    margin: 0 auto;

    :deep(.nav-breadcrumb) {
      padding: 0px;
    }
  }

  /* .page-event-detail .two-column .sidebar-column */
  .two-column {
    position: relative;
    width: 100%;
    max-width: $max-width;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;

    .primary-column {
      margin-bottom: 0px;
      width: 67%;

      .section-wrapper {
        padding-left: 0px;
      }

      &.bottom {
        margin-top: -30px;
      }
    }

    .ftva.block-info {
      margin-top: 48px;
    }

    // SECTION SCREENING DETAILS
    // TODO when component is patched, remove styles?
    :deep(figure.responsive-video:not(:has(.video-embed))) {
      display: none;
    }

    .sidebar-column {
      min-width: 314px;
      width: 30%;
      position: absolute;
      height: 100%;
      top: 0;
      right: 0;
      padding-top: var(--space-2xl);
      padding-bottom: 20px;

      .sidebar-content-wrapper {
        position: sticky;
        top: 0;
        will-change: top;
      }
    }
  }

  .full-width {
    width: 100%;
    background-color: $pale-blue;
    margin: 0 auto;

    .section-wrapper.theme-paleblue {
      background-color: $pale-blue;
    }
  }

  /* makes all EventSeries same height */
  :deep(.card) {
    min-height: 350px;
  }

  @media (max-width: 1200px) {

    .one-column,
    .two-column {
      padding-left: var(--unit-gutter);
      padding-right: var(--unit-gutter);
    }

    .sidebar-column {
      padding-right: var(--unit-gutter);
    }

    .two-column>.primary-column {
      width: 62%;
    }
  }

  @media #{$small} {
    .two-column {
      display: grid;
      grid-template-columns: 1fr;

      .primary-column {
        width: auto;
        grid-column: 1;

        .section-wrapper {
          padding-left: var(--unit-gutter);
        }

        &.bottom {
          margin-top: auto;
        }
      }

      .sidebar-column {
        width: auto;
        position: relative;
        grid-column: 1;
        margin: auto var(--unit-gutter);
        padding-top: 0px;
        height: auto; // let content determine height on mobile
      }
    }
  }
}
</style>
