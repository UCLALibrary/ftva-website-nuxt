<script setup>
// COMPONENT RE-IMPORTS
// TODO: remove when we have implemented component library as a module
// https://nuxt.com/docs/guide/directory-structure/components#library-authors
import { BlockTag, ButtonDropdown, CardMeta, DividerWayFinder, FlexibleMediaGalleryNewLightbox, NavBreadcrumb, ResponsiveImage, RichText, SectionScreeningDetails, SectionTeaserCard, SectionStaffSubjectLibrarian, SectionWrapper, TwoColLayoutWStickySideBar } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'
import removeTags from '../utils/removeTags'

// GQL
import FTVALARebellionFilmmakersDetail from '~/gql/queries/FTVALARebellionFilmmakersDetail.gql'

// COMPOSABLE
import { useContentIndexer } from '~/composables/useContentIndexer'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`events-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVALARebellionFilmmakersDetail, { slug: route.params.slug })
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.ftvaLARebellionIndividual) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

// This is creating an index of the content for ES search
if (data.value.ftvaEvent && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the event data using the composable during static build
    await indexContent(data.value.ftvaLARebellionIndividual, route.params.slug)
    // console.log('Event indexed successfully during static build')
  } catch (error) {
    console.error('FAILED TO INDEX EVENT during static build:', error)
  }
}

const page = ref(_get(data.value, 'ftvaLARebellionIndividual', {}))
// TODO refactor for filmography data ? Delete if not needed
// const series = ref(_get(data.value, 'ftvaEventSeries', {}))

watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'ftvaLARebellionIndividual', {})
  // series.value = _get(newVal, 'ftvaEventSeries', {})
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
    class="page page-detail page-event-detail"
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
        <!-- <CardMeta
          data-test="text-block"
          :title="page?.title"
        > -->
        {{ page }}
      </template>
    </TwoColLayoutWStickySideBar>

    <!-- TODO: add conditional render once vars exist
     v-if="parsedFilmography && parsedFilmography.length > 0" -->
    <SectionWrapper
      section-title="Filmography"
      theme="paleblue"
      class="series-section-wrapper"
    >
      <!-- <SectionStaffSubjectLibrarian /> -->
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
// PAGE STYLES - USE OLD STYLES
// .page-event-detail {
//   position: relative;

//   .two-column {

//     .ftva.button-dropdown {
//       margin-top: 30px;
//     }

//     .ftva.block-info {
//       margin-top: 48px;
//     }

//     // SECTION SCREENING DETAILS
//     // TODO when component is patched, remove styles?
//     :deep(figure.responsive-video:not(:has(.video-embed))) {
//       display: none;
//     }
//   }

//   /* makes all EventSeries same height */
//   :deep(.card) {
//     min-height: 350px;
//   }

//   @media (max-width: 1200px) {
//     :deep(.primary-column) {
//       width: 65%;
//     }
//   }

//   @media (max-width: 899px) {
//     :deep(.primary-column) {
//       width: inherit;
//     }

//     :deep(.block-tags) {
//       padding-top: 30px;
//     }
//   }
// }

@import 'assets/styles/slug-pages.scss';
</style>
