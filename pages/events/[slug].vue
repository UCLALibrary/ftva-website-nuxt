<script setup>
// COMPONENT RE-IMPORTS
// TODO: remove when we have implemented component library as a module
// https://nuxt.com/docs/guide/directory-structure/components#library-authors
import { BlockEventDetail, BlockInfo, BlockTag, CardMeta, DividerWayFinder, FlexibleMediaGalleryNewLightbox, NavBreadcrumb, ResponsiveImage, RichText, SectionScreeningDetails, SectionTeaserCard, SectionWrapper } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAEventDetail from '../gql/queries/FTVAEventDetail.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`events-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVAEventDetail, { slug: route.params.slug })
  console.log('data', data)
  return data
})
if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.ftvaEvent) {
  // console.log('no data')
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

const page = ref(_get(data.value, 'ftvaEvent', {}))
const series = ref(_get(data.value, 'ftvaEventSeries', {}))

watch(data, (newVal, oldVal) => {
  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(data.value, 'ftvaEvent', {})
  series.value = _get(data.value, 'ftvaEventSeries', {})
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
      credit: rawItem.creditText,
      captionTitle: 'dfdsfs', // TODO do we need these? test without
      captionText: 'dfsdfsd',
    }
  })
})

const pageId = computed(() => {
  return page.value.id
})

const parsedFtvaEventSeries = computed(() => {
  const pageId = page.value.id
  const events = series.value[0].ftvaEvent.filter((item) => {
    return item.id !== pageId // remove this page's event from the series list to avoid duplicate info
  })
  // return first 3 events
  return events.slice(0, 3)
})

const parsedFTVAEventScreeningDetails = computed(() => {
  return page?.value.ftvaEventScreeningDetails?.map((obj) => {
    return {
      ...obj,
      image: obj.image[0] // craft data has an array, but component expects a single object for image
    }
  })
})
</script>

<template>
  <main
    id="main"
    class="page page-event-detail"
  >
    <div class="one-column">
      <NavBreadcrumb class="breadcrumb" />
      <responsive-image
        v-if="parsedImage.length === 1"
        :media="parsedImage[0].image[0]"
      >
        <template #credit>
          {{ parsedImage[0].creditText }}
        </template>
      </responsive-image>
      <div
        v-else
        class="lightbox-container"
      >
        <FlexibleMediaGalleryNewLightbox :items="parsedCarouselData">
          <template #default="slotProps">
            <BlockTag :label="parsedCarouselData[slotProps.selectionIndex].creditText" />
          </template>
        </FlexibleMediaGalleryNewLightbox>
      </div>
    </div>
    <div class="two-column">
      <div class="primary-column top">
        <SectionWrapper>
          <CardMeta
            :category="series[0].title"
            :title="page.title"
            :tag-labels="page.ftvaEventFilters"
            :introduction="page.ftvaEventIntroduction"
            :text="page.eventDescription"
          />
          <RichText
            v-if="page.guestSpeaker"
            :rich-text-content="page.guestSpeaker"
          />

          <RichText
            v-if="page.acknowledements"
            :rich-text-content="page.acknowledements"
          />
        </SectionWrapper>
      </div>
      <!-- sidebar slots in here on mobile -->
      <div class="sidebar-column">
        <BlockEventDetail
          :start-date="page.startDateWithTime"
          :time="page.startDateWithTime"
          :locations="page.location"
        />

        <BlockInfo :ftva-ticket-information="page.ftvaTicketInformation" />
      </div>
      <div class="primary-column bottom">
        <SectionWrapper>
          <DividerWayFinder />
        </SectionWrapper>

        <SectionWrapper>
          <SectionScreeningDetails
            v-if="parsedFTVAEventScreeningDetails"
            :items="parsedFTVAEventScreeningDetails"
          />
        </SectionWrapper>
      </div>
    </div>
    <div class="full-width">
      <SectionWrapper
        v-if="series && series.length > 0"
        section-title="Explore upcoming events in this series"
        theme="paleblue"
      >
        <SectionTeaserCard
          v-if="series && series.length > 0"
          :items="parsedFtvaEventSeries"
        />
      </SectionWrapper>
    </div>
  </main>
</template>
<style lang="scss" scoped>
// VARS - TO DO move to global? reference tokens?
// WIDTH, HEIGHT, SPACING
$max-width: 928px;
$banner-height: 520px;
// COLORS
$pale-blue: #E7EDF2;

// PAGE STYLES
.page-event-detail {
  position: relative;

  &:before {
    content: '';
    position: absolute;
    background-color: $pale-blue;
    height: $banner-height;
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

  .two-column {
    position: relative;
    width: 100%;
    max-width: $max-width;
    display: grid;
    grid-template-columns: 3fr 1fr;
    // justify-content: space-between;

    .primary-column {
      grid-column: 1;
      margin-bottom: 0px;

      .section-wrapper {
        padding-left: 0px;
      }

      &.bottom {
        margin-top: -30px;
      }
    }

    // SECTION SCREENING DETAILS
    // TODO when component is patched, remove styles?
    :deep(figure.responsive-video:not(:has(.video-embed))) {
      display: none;
    }

    :deep(figure.responsive-video) {
      .sizer {
        height: 568px; // TODO ask UX if FTVA videos on this page have fixed height or not
      }
    }

    .sidebar-column {
      grid-column: 2;
      position: sticky;
      align-self: start;
      top: 0;
      will-change: top;
      padding-top: var(--space-2xl);
      padding-bottom: 20px;
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

  @media #{$small} {
    .two-column {
      grid-template-columns: 1fr;

      .primary-column {
        .section-wrapper {
          padding-left: var(--unit-gutter);
        }

        &.bottom {
          margin-top: auto;
        }
      }

      .sidebar-column {
        position: relative;
        grid-column: 1;
        margin: auto var(--unit-gutter);
        padding-top: 0px;
      }
    }
  }
}
</style>
