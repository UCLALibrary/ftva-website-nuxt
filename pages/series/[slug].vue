<script setup>
// COMPONENT RE-IMPORTS
// TODO: remove when we have implemented component library as a module
// https://nuxt.com/docs/guide/directory-structure/components#library-authors
import { BlockCardThreeColumn, BlockEventDetail, BlockInfo, BlockTag, CardMeta, DividerWayFinder, FlexibleMediaGalleryNewLightbox, NavBreadcrumb, ResponsiveImage, RichText, SectionScreeningDetails, SectionTeaserCard, SectionTeaserList, SectionWrapper, TabItem, TabList, TwoColLayoutWStickySideBar } from 'ucla-library-website-components'

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
    return {
      ...item,
      to: `/${item.to}`,
      image: item.image && item.image.length > 0 ? item.image[0] : null
    }
  })
})

const parsedPastEvents = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!pastEvents.value)
    return []

  // Transform data
  return pastEvents.value.map((item, index) => {
    return {
      ...item,
      to: `/${item.to}`,
      image: item.image && item.image.length > 0 ? item.image[0] : null
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
      image: item.ftvaImage && item.ftvaImage.length > 0 ? item.ftvaImage[0] : null,
    }
  })
  return otherSeries
})

// MOBILE LOGIC
const globalStore = useGlobalStore()
const isMobile = ref(false)
watch(globalStore, (newVal, oldVal) => {
  isMobile.value = globalStore.winWidth <= 750
})

// LAYOUT & STYLES
// TO DO THIS SECTION MAY BE WORTH ADDING TO 2 COL SIDE BAR LAYOUT
// Track height of sidebar and ensure main content as at least as tall
const sidebar = ref(null)
const primaryCol = ref(null)

watch([isMobile, sidebar], ([newValIsMobile, newValSidebar], [oldValGlobalStore, oldValSidebar]) => {
  if (newValIsMobile === true) {
    primaryCol.value.style.minHeight = 'auto' // on mobile, reset height
  } else {
    primaryCol.value.style.minHeight = `${newValSidebar.clientHeight + 125}px`
  }
}, { deep: true })

// globalstore state is lost when error page is generated , this is hack to repopulate state on client side
onMounted(() => {
  isMobile.value = globalStore.winWidth <= 750 // 750px is the breakpoint for mobile
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
        :title="page?.title"
        to="/series"
        parent-title="Screening Series"
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

    <TwoColLayoutWStickySideBar>
      <template #primaryTop>
        <CardMeta
          category="Series"
          :title="page?.title"
        />
      </template>

      <template #primaryMid>
        <RichText
          v-if="page?.eventDescription"
          :rich-text-content="page?.eventDescription"
        />

        <RichText
          v-if="page?.richText"
          :rich-text-content="page?.richText"
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
          data-test="ticket-info"
          :ftva-ticket-information="page?.ftvaTicketInformation"
        />
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
                There are no upcoming events in this series.
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
                There are no past events in this series.
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
      />
    </SectionWrapper>
  </main>
</template>

<style
  lang="scss"
  scoped
>
// GENERAL PAGE STYLES / DESKTOP
.page-event-series-detail {
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

    .one-column {
      padding-left: var(--unit-gutter);
      padding-right: var(--unit-gutter);
    }

    .two-column {
      padding-right: 0;
    }

    .sidebar-column {
      padding-right: var(--unit-gutter);
    }
  }
}
</style>
