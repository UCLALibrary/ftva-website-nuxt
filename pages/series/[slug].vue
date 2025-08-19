<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAEventSeriesDetail from '../gql/queries/FTVAEventSeriesDetail.gql'

// UTIL
import getEventFilterLabels from '~/utils/getEventFilterLabels'

// COMPOSABLE
import { useContentIndexer } from '~/composables/useContentIndexer'
import removeTags from '~/utils/removeTags'

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

// This is creating an index of the main content (not related content)
if (data.value.ftvaEventSeries && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the event series data using the composable during static build
    data.value.ftvaEventSeries.groupName = 'Series'
    await indexContent(data.value.ftvaEventSeries, route.params.slug)
    // console.log('Event series indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX EVENT SERIES during static build:', error)
  }
}

const page = ref(_get(data.value, 'ftvaEventSeries', {}))
const upcomingEvents = ref(_get(data.value, 'upcomingEvents', {}))
const pastEvents = ref(_get(data.value, 'pastEvents', {}))
const otherSeriesOngoing = ref(_get(data.value, 'otherSeriesOngoing', {}))
const otherSeriesUpcoming = ref(_get(data.value, 'otherSeriesUpcoming', {}))

watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'ftvaEventSeries', {})
  upcomingEvents.value = _get(newVal, 'upcomingEvents', {})
  pastEvents.value = _get(newVal, 'pastEvents', {})
  otherSeriesOngoing.value = _get(newVal, 'otherSeriesOngoing', {})
  otherSeriesUpcoming.value = _get(newVal, 'otherSeriesUpcoming', {})
})

// Get data for Image or Carousel at top of page
const parsedImage = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!page.value.imageCarousel) {
    return []
  }
  return page.value.imageCarousel
})

// Transform data for Carousel
const parsedCarouselData = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!parsedImage.value) {
    return []
  }
  // map image to item, map creditText to credit
  return parsedImage.value.map((rawItem, index) => {
    return {
      item: [{ ...rawItem.image[0], kind: 'image' }], // Carousels on this page are always images, no videos
      credit: rawItem?.creditText,
    }
  })
})

// Transform Data for Tabbed Section
const parsedUpcomingEvents = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!upcomingEvents.value)
    return []

  // Transform data
  return upcomingEvents.value.map((item, index) => {
    const parsedTagLabels = getEventFilterLabels(item)

    return {
      ...item,
      tagLabels: parsedTagLabels,
      to: `/${item.to}`,
      image: parseImage(item)
    }
  })
})

const parsedPastEvents = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!pastEvents.value)
    return []

  // Transform data
  return pastEvents.value.map((item, index) => {
    const parsedTagLabels = getEventFilterLabels(item)

    return {
      ...item,
      tagLabels: parsedTagLabels,
      to: `/${item.to}`,
      image: parseImage(item) // item.image && item.image.length > 0 ? item.image[0] : null // parseImage
    }
  })
})

// If no Upcoming Events, set starting tab to Past Events
const parsedInitialTabIndex = computed(() => {
  if (parsedUpcomingEvents.value.length === 0) {
    return 1
  } else {
    return 0
  }
})

// Transform data for Other Series Section
// This section only shows 3 items max, and prioritizes upcoming events over ongoing
const parsedOtherSeries = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!otherSeriesUpcoming.value && !otherSeriesOngoing.value)
    return []

  let otherSeries = otherSeriesUpcoming.value.concat(otherSeriesOngoing.value)
  // Remove current series from list
  otherSeries = otherSeries.filter(item => !item.uri.includes(route.params.slug))
  // Get first 3 events
  otherSeries = otherSeries.slice(0, 3)

  // Transform data
  otherSeries = otherSeries.map((item, index) => {
    return {
      ...item,
      to: `/${item.uri}`, // remove 'series/' from uri
      startDate: item.startDate ? item.startDate : null,
      endDate: item.endDate ? item.endDate : null,
      ongoing: item.ongoing,
      sectionHandle: item.sectionHandle, // 'ftvaEventSeries'
      image: parseImage(item) // item.ftvaImage && item.ftvaImage.length > 0 ? item.ftvaImage[0] : null, // parseImage
    }
  })
  return otherSeries
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
    class="page page-detail page-detail--paleblue page-event-series-detail"
  >
    <div class="one-column">
      <NavBreadcrumb
        class="breadcrumb"
        :title="page?.title"
        to="/series"
        parent-title="Series"
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
        <FlexibleMediaGalleryNewLightbox
          v-if="parsedCarouselData && parsedCarouselData.length > 0"
          :items="parsedCarouselData"
          inline="true"
        >
          <template #default="slotProps">
            <BlockTag :label="parsedCarouselData[slotProps.selectionIndex]?.creditText" />
          </template>
        </FlexibleMediaGalleryNewLightbox>
      </div>
    </div>

    <TwoColLayoutWStickySideBar>
      <template #primaryTop>
        <CardMeta
          category="Series"
          :title="page?.title"
          :guest-speaker="page?.guestSpeaker"
          :introduction="page?.ftvaEventIntroduction"
        />
      </template>

      <template #primaryMid>
        <RichText
          v-if="page?.eventDescription"
          :rich-text-content="page?.eventDescription"
        />
        <RichText
          v-if="page?.acknowledgement"
          :rich-text-content="page?.acknowledgement"
        />
      </template>

      <!-- Sidebar -->
      <template #sidebarTop>
        <BlockEventDetail
          data-test="event-details"
          :start-date="page?.startDate"
          :end-date="page?.endDate"
          :ongoing="page?.ongoing"
          :locations="page?.location"
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
              to="/plan-your-visit"
              class="button"
              :is-secondary="true"
              icon-name="none"
            />
          </template>
        </BlockInfo>
      </template>
    </TwoColLayoutWStickySideBar>

    <div class="full-width">
      <SectionWrapper theme="paleblue">
        <TabList
          alignment="left"
          :initial-tab="parsedInitialTabIndex"
        >
          <TabItem
            title="Upcoming Events"
            class="tab-content"
          >
            <template v-if="parsedUpcomingEvents && parsedUpcomingEvents.length > 0">
              <!-- :n-shown="10"  this prop does not do anything if theme is ftva-->
              <SectionTeaserList
                :items="parsedUpcomingEvents"
                component-name="BlockCardThreeColumn"
                :n-shown="10"
                class="tabbed-event-list"
              />
            </template>
            <template v-else>
              <p class="empty-tab">
                There are no upcoming events in this series
              </p>
            </template>
          </TabItem>

          <TabItem
            title="Past Events"
            class="tab-content"
          >
            <template v-if="parsedPastEvents && parsedPastEvents.length > 0">
              <SectionTeaserList
                :items="parsedPastEvents"
                component-name="BlockCardThreeColumn"
                n-shown="10"
                class="tabbed-event-list"
              />
            </template>
            <template v-else>
              <p class="empty-tab">
                There are no past events in this series
              </p>
            </template>
          </TabItem>
        </TabList>
      </SectionWrapper>
    </div>

    <SectionWrapper
      v-if="parsedOtherSeries && parsedOtherSeries.length > 0"
      :items="parsedOtherSeries"
      section-title="Explore other series"
      class="series-section-wrapper"
    >
      <template #top-right>
        <nuxt-link to="/series">
          View All Series <span style="font-size:1.5em;"> &#8250;</span>
        </nuxt-link>
      </template>
      <SectionTeaserCard
        class="other-series-section"
        :items="parsedOtherSeries"
        :grid-layout="false"
      />
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
// GENERAL PAGE STYLES / DESKTOP
.page-event-series-detail {
  position: relative;

  .full-width {
    width: 100%;
    background-color: var(--pale-blue);
    margin: 0 auto;

    .section-wrapper.theme-paleblue {
      background-color: var(--pale-blue);
    }
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

  :deep(.responsive-image .media),
  :deep(.responsive-image) {
    position: initial;
    max-height: 500px;
  }

  :deep(.responsive-image .sizer) {
    padding-bottom: 0 !important;
  }

  :deep(.block-card-three-column .image-block),
  :deep(.block-card-three-column .image-block .image),
  :deep(.block-highlight .image .media),
  :deep(.block-highlight .image) {
    aspect-ratio: 1.69 / 1;
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

  .other-series-section {
    &:has(> :last-child:nth-child(3)) {
      /* if section has 3 elements */
      justify-content: space-between;
    }

    /* makes all Other Series same height */
    :deep(.card) {
      min-height: 350px;
    }
  }

  // MEDIUM DEVICE STYLES
  @media (max-width: 1200px) {

    .two-column {
      padding-right: 0;
    }
  }

  @media #{$medium} {

    :deep(.carousel),
    :deep(.lightbox .media-item) {
      height: calc(var(--media-width) / 1.575);
    }

    :deep(.one-column .responsive-image) {
      aspect-ratio: 1.69/1;
    }

    :deep(.card-meta .title-no-link) {
      font-size: 34px;
    }
  }
}

@import 'assets/styles/slug-pages.scss';
</style>
