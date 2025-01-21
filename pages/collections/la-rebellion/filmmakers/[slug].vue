<script setup>
// COMPONENT RE-IMPORTS
// TODO: remove when we have implemented component library as a module
// https://nuxt.com/docs/guide/directory-structure/components#library-authors
import { BlockTag, ButtonDropdown, CardMeta, DividerWayFinder, FlexibleMediaGalleryNewLightbox, NavBreadcrumb, ResponsiveImage, RichText, SectionStaffSubjectLibrarian, SectionWrapper, TwoColLayoutWStickySideBar } from 'ucla-library-website-components'

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
if (data.value.ftvaLARebellionIndividual && import.meta.prerender) {
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

watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'ftvaLARebellionIndividual', {})
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
    class="page page-detail page-filmmaker-detail"
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
          category="L.A. Rebellion"
          :title="page?.title"
        >
          <template #sharebutton>
            <ButtonDropdown
              data-test="share-button"
              button-title="Share"
              :has-icon="true"
              :dropdown-list="socialList.dropdownList"
            />
          </template>
        </CardMeta>
        <RichText :rich-text-content="page?.richText" />
      </template>
    </TwoColLayoutWStickySideBar>

    <SectionWrapper
      v-if="page.associatedFilms && page.associatedFilms.length > 0"
      section-title="Filmography"
      theme="paleblue"
      class="filmography-section-wrapper"
    >
      <section-staff-subject-librarian
        :items="page.associatedFilms"
        :table-headers="['', 'Film', 'Role', 'Year']"
      />
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/slug-pages.scss';
.page-filmmaker-detail {
  position: relative;

  .two-column {

    .ftva.button-dropdown {
      margin-top: 30px;
    }

    .ftva.block-info {
      margin-top: 48px;
    }

    // fix button scrolling over header
    :deep(.sharebutton-slot) {
      position: relative;
      z-index: 1;
    }
  }

  // change filmography section title color
  :deep(.section-header) {
    .section-title {
      color: #2f2f2f;
    }
    font-weight: 800;
  }
}
</style>
