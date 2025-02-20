<script setup>
// COMPONENT RE-IMPORTS
// TODO: remove when we have implemented component library as a module
// https://nuxt.com/docs/guide/directory-structure/components#library-authors
import {
  TwoColLayoutWStickySideBar, NavBreadcrumb, ResponsiveImage, CardMeta, RichText, PageAnchor, FlexibleBlocks, SectionWrapper,
} from 'ucla-library-website-components'

import { onMounted, nextTick } from 'vue'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVA_GENERAL_CONTENT_DETAIL from '../gql/queries/FTVAGeneralContentDetail.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

const path = route.path.replace(/^\/|\/$/g, '') // trim initial and/or final slashes

// Because the generalcontent page uses ftva / in the uri
// to differentiate between the library and meap websites
// the GQL query will need the slug instead of the uri
const { data, error } = await useAsyncData(`general-content-${path}`, async () => {
  const data = await $graphql.default.request(FTVA_GENERAL_CONTENT_DETAIL, {
    slug: path.substring(
      path.lastIndexOf('/') + 1
    ),
  })
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entry) {
  // console.log('no data')
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

if (data.value.entry && import.meta.prerender) {
  // Call the composable to use the indexing function
  const { indexContent } = useContentIndexer()
  await indexContent(data.value.entry, path.replaceAll('/', '--'))
}

const page = ref(_get(data.value, 'entry', {}))

watch(data, (newVal, oldVal) => {
  // eslint-disable-next-line no-console
  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'entry', {})
})

const h2Array = ref([]) // anchor tags

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
  title: page.value ? page.value.title : '... loading'
})

onMounted(() => {
  if (process.client) {
    setTimeout(async () => {
      await nextTick()
      h2Array.value = getHeaders()
    }, 1500) // Delay ensures DOM is fully updated
  }
})
</script>

<template lang="html">
  <main
    id="main"
    class="page page-detail page-general-content"
  >
    <div class="one-column">
      <NavBreadcrumb data-test="breadcrumb" />

      <ResponsiveImage
        v-if="parsedImage && parsedImage.length === 1 && parsedImage[0]?.image && parsedImage[0]?.image?.length === 1"
        data-test="single-image"
        :media="parsedImage[0]?.image[0]"
        :aspect-ratio="43.103"
      />

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
        <div v-if="page.formattedTitle">
          <h3>
            <rich-text :rich-text-content="page.formattedTitle" />
          </h3>
        </div>

        <div v-else>
          <h3 class="page-title">
            {{ page.title }}
          </h3>
        </div>
      </template>

      <template #primaryMid>
        <FlexibleBlocks
          class="flexible-content"
          :blocks="page.blocks"
        />
      </template>

      <template #sidebarTop>
        <PageAnchor
          v-if="h2Array.length >= 3"
          :section-titles="h2Array"
        />
      </template>
    </TwoColLayoutWStickySideBar>

    <SectionWrapper section-title="HEADERS for the PageAnchors">
      <code> {{ getHeaders() }}</code>
    </SectionWrapper>

    <SectionWrapper section-title="PAGE DATA">
      <code>{{ page }}</code>
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
.page-general-content {
  position: relative;

  .page-title {
    @include card-clickable-area;
    display: block;

    .translation {
      display: block;
    }

    @include ftva-h2;
    color: $heading-grey;
    margin: 0 0 24px;
  }
}

@import 'assets/styles/slug-pages.scss';
</style>
