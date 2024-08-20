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
    ...error.value, statusMessage: 'Page not found WEIRDO.' + error.value, fatal: true
  })
}

if (!data.value.ftvaEventSeries) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found JEN JEN',
    fatal: true
  })
}

const page = ref(_get(data.value, 'ftvaEventSeries', {}))

watch(data, (newVal, oldVal) => {
  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(data.value, 'ftvaEventSeries', {})
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
      captionTitle: 'dfdsfs', // TODO do we need these? test without
      captionText: 'dfsdfsd',
    }
  })
})
</script>

<template>
  <main
    id="main"
    class="page page-ftva-event-series-detail"
  >

    <div class="one-column">
      <NavBreadcrumb
        class="breadcrumb"
        :title="page.title"
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

    <!-- <div
        v-else
        class="lightbox-container"
      >
        <FlexibleMediaGalleryNewLightbox :items="parsedCarouselData">
          <template #default="slotProps">
            <BlockTag :label="parsedCarouselData[slotProps.selectionIndex]?.creditText" />
          </template>
        </FlexibleMediaGalleryNewLightbox>
      </div>
    </div> -->


    <pre>{{ page }}</pre>
  </main>
</template>

<style
  lang="scss"
  scoped
></style>
