<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAEventDetail from '../gql/queries/FTVAEventDetail.gql'

// COMPOSABLE
import removeTags from '~/utils/removeTags'
import { useContentIndexer } from '~/composables/useContentIndexer'

// UTILS
import getEventFilterLabels from '~/utils/getEventFilterLabels'

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

// This is creating an index of the main content (not related content)
if (data.value.ftvaEvent && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the event data using the composable during static build
    data.value.ftvaEvent.groupName = 'Events'
    await indexContent(data.value.ftvaEvent, route.params.slug)
    // console.log('Event indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX EVENT during static build:', error)
  }
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

// Extract tag labels from event filters
const parsedTagLabels = computed(() => {
  const eventObj = page.value
  const parsedTagLabels = getEventFilterLabels(eventObj)

  const hasGuestSpeaker = parsedTagLabels.some(tag =>
    /Guest Speaker/i.test(tag.title)
  )

  if (hasGuestSpeaker) {
    return [{ title: 'Guest speaker' }]
  }

  return []
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
    class="page page-detail page-detail--paleblue page-event-detail"
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
          v-if="parsedCarouselData && parsedCarouselData.length > 0"
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
          class="title"
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
          class="intro"
          :guest-speaker="page?.guestSpeaker"
          :tag-labels="parsedTagLabels"
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
          color-scheme="paleblue"
          data-test="ticket-info"
          class="ticket-info"
        >
          <template #block-info-top>
            <h3 class="block-info-header">
              Ticket Info
            </h3>
          </template>
          <template #block-info-mid>
            <ul class="block-info-list">
              <li
                v-for="(item, index) in page?.ftvaTicketInformation"
                :key="`${item}-${index}`"
              >
                {{ item.title }}
              </li>
            </ul>
          </template>
          <template #block-info-end>
            <ButtonLink
              label="Plan Your Visit"
              to="/billy-wilder-theater"
              class="button"
              :is-secondary="true"
              icon-name="none"
            />
          </template>
        </BlockInfo>
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
      section-title="More in this series"
      theme="paleblue"
      class="series-section-wrapper"
    >
      <SectionTeaserCard
        v-if="parsedFtvaEventSeries && parsedFtvaEventSeries.length > 0"
        data-test="event-series"
        :items="parsedFtvaEventSeries"
        :grid-layout="false"
      />
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
.page-event-detail {
  position: relative;

  :deep(.lightbox) {
    overflow: hidden;
  }

  :deep(.carousel),
  :deep(.lightbox .media-item) {
    height: calc(var(--media-width) / 1.984);
  }

  :deep(.inline.lightbox .button-prev) {
    left: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    opacity: 0.7;
  }

  :deep(.inline.lightbox .button-next) {
    right: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    opacity: 0.7;
  }

  .two-column {

    .button-dropdown {
      margin-top: 30px;
    }

    .block-info {
      margin-top: 48px;
    }

    :deep(.card-meta.intro) {
      display: flex;
      flex-direction: column;

      .title-no-link:empty {
        display: none;
      }

      /* REMOVE THIS HACK WHEN WE REORDER IT IN THE COMPONENT */
      .block-tags {
        order: 1;
        padding-top: 0;
      }

      .guestSpeaker {
        order: 2;
        margin-bottom: 16px;
      }

      .introduction {
        order: 3;
      }
    }

    :deep(.guestSpeaker p) {
      color: #132941;
      font-size: 16px;
      font-weight: 500;
      line-height: normal;
    }

    :deep(.card-meta .guestSpeaker .parsed-content:last-child) {
      margin-bottom: 0;
    }

    :deep(.card-meta .block-tags) {
      margin-bottom: 16px;
    }

    // SECTION SCREENING DETAILS
    // TODO when component is patched, remove styles?
    :deep(figure.responsive-video:not(:has(.video-embed))) {
      display: none;
    }

    :deep(.block-screening-detail .text) {
      margin-top: 25px;
    }

    :deep(.block-screening-detail .rich-text:last-child .parsed-content) {
      margin-bottom: 0;
    }
  }

  :deep(.series-section-wrapper .section-title) {
    color: #115DAF;
    font-family: Karbon;
    font-size: 30px;
    font-style: normal;
    font-weight: 500;
    line-height: 120%;
  }

  /* makes all EventSeries same height */
  :deep(.card) {
    min-height: 350px;
  }

  @media (max-width: 1200px) {
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

  @media #{$medium} {
    :deep(.one-column .responsive-image) {
      aspect-ratio: 1.69/1;
    }

    :deep(.card-meta .title-no-link) {
      font-size: 34px;
    }

    :deep(.primary-section-wrapper) {
      display: flex;
      flex-direction: column;

      .card-meta.title {
        order: 0;
        margin: 0;
      }

      .card-meta.intro {
        order: 1;
        margin: 0;
      }

      .sidebar-mobile-top {
        order: 2;
        margin: 0;

        .block-event-detail {
          margin-bottom: 24px;
        }

        .button-dropdown {
          margin: 24px 0;
        }
      }

      .eventDescription {
        order: 4;
      }

      .acknowledgements {
        order: 3;
        margin: 0;
      }

      .sidebar-mobile-bottom {
        order: 5;
        margin: 24px 0;

        .block-info {
          margin: 0;
        }
      }

      >.divider-way-finder {
        order: 5;
        margin: 24px 0 40px;
      }

      .section-screening-details {
        order: 6;
      }
    }

    :deep(.ftva.block-screening-detail) {
      .event-title {
        margin: 10px 0;
      }

      .title {
        font-size: 28px;
        line-height: 110%;
      }
    }
  }
}

@import 'assets/styles/slug-pages.scss';
</style>
