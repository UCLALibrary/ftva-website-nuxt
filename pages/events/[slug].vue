<script setup>
// COMPONENT RE-IMPORTS
// TODO: remove when we have implemented component library as a module
// https://nuxt.com/docs/guide/directory-structure/components#library-authors
import { BlockEventDetail, BlockInfo, BlockTag, ButtonDropdown, CardMeta, DividerWayFinder, FlexibleMediaGalleryNewLightbox, NavBreadcrumb, ResponsiveImage, RichText, SectionScreeningDetails, SectionTeaserCard, SectionWrapper, TwoColLayoutWStickySideBar } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'
import removeTags from '../utils/removeTags'

// GQL
import FTVAEventDetail from '../gql/queries/FTVAEventDetail.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()
// DATA
const { data, error } = await useAsyncData(`events-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVAEventDetail, { slug: route.params.slug })
  return data
})
if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.ftvaEvent) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

const page = ref(_get(data.value, 'ftvaEvent', {}))
const series = ref(_get(data.value, 'ftvaEventSeries', {}))

watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'ftvaEvent', {})
  series.value = _get(newVal, 'ftvaEventSeries', {})
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

// Data for Calendar Dropdown
const parsedCalendarData = computed(() => {
  const event = page.value
  return {
    title: event.title,
    eventDescription: event.eventDescription,
    startDateWithTime: event.startDateWithTime,
    location: event.location
  }
})

const parsedFtvaEventSeries = computed(() => {
  /* Early Returns: If series.value is falsy or empty, or
    if firstSeries.ftvaEvent is falsy or empty, return
    an empty array immediately. */
  if (!series.value || series.value.length === 0) {
    return []
  }

  const [firstSeries] = series.value

  if (!firstSeries.ftvaEvent || firstSeries.ftvaEvent.length === 0) {
    return []
  }

  // Destructure each series item object and its image object
  const seriesEvents = firstSeries.ftvaEvent.map(({ image, to, ...rest }) => ({
    ...rest,
    to: `/events/${to}`,
    image: image && image.length > 0 ? image[0] : null,
  }))

  const pageId = page.value.id

  // Return series without the page's featured event
  const filteredEvents = seriesEvents.filter(({ id }) => id !== pageId)

  // Return first 3 events
  return filteredEvents.slice(0, 3)
})

const parsedFTVAEventScreeningDetails = computed(() => {
  return page?.value.ftvaEventScreeningDetails?.map((obj) => {
    return {
      ...obj,
      image: obj.image && obj.image.length === 1 ? obj.image[0] : null, // craft data has an array, but component expects a single object for image
    }
  })
})

useHead({
  title: page.value ? page.value.title : '... loading',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: removeTags(page.value.text)
    }
  ]
})
</script>

<template>
  <main
    id="main"
    class="page page-event-detail"
  >
    <div class="one-column">
      <NavBreadcrumb
        class="breadcrumb"
        data-test="breadcrumb"
        :title="page?.title"
      />

      <ResponsiveImage
        v-if="parsedImage && parsedImage.length === 1 && parsedImage[0]?.image && parsedImage[0]?.image?.length === 1"
        data-test="single-image"
        :media="parsedImage[0]?.image[0]"
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
        <FlexibleMediaGalleryNewLightbox
          data-test="image-carousel"
          :items="parsedCarouselData"
          inline="true"
        >
          <template #default="slotProps">
            <BlockTag
              data-test="credit-text"
              :label="parsedCarouselData[slotProps.selectionIndex]?.creditText"
            />
          </template>
        </FlexibleMediaGalleryNewLightbox>
      </div>
    </div>

    <TwoColLayoutWStickySideBar
      data-test="second-column"
      class="two-column"
    >
      <template #primaryTop>
        <CardMeta
          data-test="text-block"
          :title="page?.title"
        >
          <template #linkedcategoryslot>
            <NuxtLink :to="`/${series[0]?.to}`">
              {{ series[0]?.title }}
            </NuxtLink>
          </template>
        </CardMeta>
      </template>

      <template #sidebarTop>
        <BlockEventDetail
          data-test="event-details"
          :start-date="page?.startDateWithTime"
          :time="page?.startDateWithTime"
          :locations="page?.location"
        />
        <ButtonDropdown
          data-test="calendar-dropdown"
          :title="parsedCalendarData?.title"
          :event-description="parsedCalendarData?.eventDescription"
          :start-date-with-time="parsedCalendarData?.startDateWithTime"
          :location="parsedCalendarData?.location"
          :is-event="true"
          :debug-mode-enabled="false"
        />
      </template>

      <template #primaryMid>
        <CardMeta
          :guest-speaker="page?.guestSpeaker"
          :tag-labels="page?.tagLabels"
          :introduction="page?.introduction"
        />
        <RichText
          v-if="page?.eventDescription"
          data-test="event-description"
          class="eventDescription"
          :rich-text-content="page?.eventDescription"
        />
        <RichText
          v-if="page?.acknowledements"
          data-test="acknowledgements"
          class="acknowledgements"
          :rich-text-content="page?.acknowledements"
        />
      </template>

      <template #sidebarBottom>
        <BlockInfo
          v-if="page?.ftvaTicketInformation && page?.ftvaTicketInformation.length > 0"
          data-test="ticket-info"
          :ftva-ticket-information="page?.ftvaTicketInformation"
        />
      </template>

      <template #primaryBottom>
        <DividerWayFinder />
        <SectionScreeningDetails
          v-if="parsedFTVAEventScreeningDetails"
          data-test="screening-details"
          :items="parsedFTVAEventScreeningDetails"
        />
      </template>
    </TwoColLayoutWStickySideBar>

    <SectionWrapper
      v-if="parsedFtvaEventSeries && parsedFtvaEventSeries.length > 0"
      section-title="Upcoming events in this series"
      theme="paleblue"
      class="series-section-wrapper"
    >
      <SectionTeaserCard
        v-if="parsedFtvaEventSeries && parsedFtvaEventSeries.length > 0"
        data-test="event-series"
        :items="parsedFtvaEventSeries"
      />
    </SectionWrapper>
  </main>
</template>

<style
  lang="scss"
  scoped
>
// PAGE STYLES
.page-event-detail {
  position: relative;

  &:before {
    content: '';
    position: absolute;
    background-color: var(--pale-blue);
    aspect-ratio: 1440 / 520;
    max-height: 518px; //prevent overflow on large screens
    min-height: 225px; //prevent too much shrinking on small screens
    width: 100%;
    z-index: -1;
  }

  .one-column {
    width: 100%;
    max-width: var(--max-width);
    margin: 0 auto;

    :deep(.nav-breadcrumb) {
      padding: 0px;
    }
  }

  .two-column {

    .ftva.button-dropdown {
      margin-top: 30px;
    }

    .ftva.block-info {
      margin-top: 48px;
    }

    // SECTION SCREENING DETAILS
    // TODO when component is patched, remove styles?
    :deep(figure.responsive-video:not(:has(.video-embed))) {
      display: none;
    }
  }

  /* makes all EventSeries same height */
  :deep(.card) {
    min-height: 350px;
  }

  @media (max-width: 1200px) {

    // .two-column
    .one-column {
      padding-left: var(--unit-gutter);
      padding-right: var(--unit-gutter);
    }

    :deep(.primary-column) {
      width: 65%;
    }
  }

  @media (max-width: 899px) {
    :deep(.primary-column) {
      width: inherit;
    }

    :deep(.block-tags) {
      padding-top: 30px;
    }
  }
}
</style>
