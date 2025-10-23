<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVATouringSeriesDetail from '../gql/queries/FTVATouringSeriesDetail.gql'

// COMPOSABLE
import removeTags from '~/utils/removeTags'
import { useContentIndexer } from '~/composables/useContentIndexer'

const { $graphql } = useNuxtApp()

const route = useRoute()

// GQL DATA
const { data, error } = await useAsyncData(`touring-events-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVATouringSeriesDetail, { slug: route.params.slug })
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.ftvaTouringSeries) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

// METADATA INFO FOR INDEXING
if (data.value.ftvaTouringSeries && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the event data using the composable during static build
    data.value.ftvaTouringSeries.sortTitle = normalizeTitleForAlphabeticalBrowseBy(data.value.ftvaTouringSeries.title)
    data.value.ftvaTouringSeries.groupName = 'Series'
    // Add the event series title and link data if available
    if (data.value.ftvaTouringSeries) {
      data.value.ftvaTouringSeries.eventSeriesTitle = data.value.ftvaTouringSeries[0]?.title || null
      data.value.ftvaTouringSeries.eventSeriesLink = data.value.ftvaTouringSeries[0]?.to || null
    }
    await indexContent(data.value.ftvaTouringSeries, route.params.slug)
    console.log('Touring Series indexed successfully during static build', data.value.ftvaTouringSeries)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX EVENT during static build:', error)
  }
}

const page = ref(_get(data.value, 'ftvaTouringSeries', {}))
const series = ref(_get(data.value, 'otherSeriesUpcoming', {}))

// PREVIEW LOGIC
watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'ftvaTouringSeries', {})
  series.value = _get(newVal, 'otherSeriesUpcoming', {})
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
      // touring-series-ftva/
      item: [{ ...rawItem.image[0], kind: 'image' }], // Carousels on this page are always images, no videos
      credit: rawItem?.creditText,
    }
  })
})

// Transform data for Other Touring Series Section
// This section only shows 3 items max
// It displays a randomized touring series past or present excluding the touring series on the current page
const parsedOtherTouringSeries = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!series.value)
    return []

  let otherSeries = series.value
  // Remove current series from list
  otherSeries = otherSeries.filter(item => !item.uri.includes(route.params.slug))
  // Get first 3 events
  otherSeries = otherSeries.slice(0, 3)

  // Transform data
  otherSeries = otherSeries.map((item, index) => {
    return {
      ...item,
      to: `/${item.uri}`,
      startDate: item.startDate ? item.startDate : null,
      endDate: item.endDate ? item.endDate : null,
      sectionHandle: item.sectionHandle, // 'ftvaTouringSeries'
      image: parseImage(item)
    }
  })
  return otherSeries
})

// Check to see if the tour series has ended
const today = new Date()
today.setHours(0, 0, 0, 0)

const tourHasCompleted = computed(() => {
  if (!page.value?.endDate) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0) // normalize to midnight

  const endDate = new Date(page.value.endDate)
  endDate.setHours(0, 0, 0, 0)

  // true if today is *after* the end date
  return today > endDate
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
    class="page page-detail page-detail--paleblue page-touring-series-detail"
  >
    <div class="one-column">
      <NavBreadcrumb
        class="breadcrumb"
        :title="page?.title"
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
          :inline="true"
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
        >
          <template #anyTitle>
            <h1 class="title-no-link">{{page.title}}</h1>
          </template>
        </CardMeta>
      </template>

      <template #primaryMid>
        <RichText
          v-if="page?.richText"
          :rich-text-content="page?.richText"
        />

        <SectionHeader
        :level="2"
        class="section-header"
        data-test="section-header"
        >
          Tour Dates
        </SectionHeader>
        <RichText
          v-if="page?.richText"
          class="tour-dates"
          :rich-text-content="page?.richTextDefaultWithTable"
        />
      </template>

      <!-- Sidebar -->
      <template #sidebarTop>
        <BlockEventDetail
          data-test="touring-series-date-range"
          class="block-event-detail"
          :start-date="page?.startDate"
          :end-date="page?.endDate"
        />
        <em v-if="tourHasCompleted" class="completed-tour">This series has completed its tour.</em>
      </template>
    </TwoColLayoutWStickySideBar>

    <SectionWrapper
      v-if="parsedOtherTouringSeries && parsedOtherTouringSeries.length > 0"
      section-title="Explore our other series"
      theme="paleblue"
      class="series-section-wrapper"
    >
      <template #top-right>
        <nuxt-link to="/touring-series">
          View All Touring Series <span style="font-size:1.5em;"> &#8250;</span>
        </nuxt-link>
      </template>
      <SectionTeaserCard
        data-test="other-touring-series"
        class="ftva-other-touring-series"
        :items="parsedOtherTouringSeries"
        :grid-layout="false"
      />
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
// TODO Make the table in FPB RichText component responsive
@import 'assets/styles/slug-pages.scss';
.page-touring-series-detail {
  .tour-dates {
    :deep(table) {
      border: 0;
      padding: 0;
    }
    :deep(td:first-child) {
      min-width: 100px;
    }
  }

  :deep(.title-no-link) {
    @include ftva-h2;
    color: var(--heading-grey);
  }

  :deep(.two-column .sidebar-column .sidebar-content-wrapper > .block-event-detail) {
    margin-bottom: 0;
  }

  .completed-tour {
    @include ftva-body;
    color: medium-grey;
    margin-bottom: 24px;
  }

  // TODO CardMeta SectionHandle hide time & diamond without changing component
  :deep(.ftva-other-touring-series .start-date::after),
  :deep(.ftva-other-touring-series .parsed-time){
    display: none;
  }

  @media (max-width: 899px) {
    :deep(.two-column .primary-column .sidebar-mobile-top > .block-event-detail) {
      margin-bottom: 0;
    }
    :deep(.two-column .primary-column .sidebar-mobile-top) {
      margin-bottom: 24px;
    }
  }
}
</style>
