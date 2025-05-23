<script setup>

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionStory from '../gql/queries/FTVACollectionStory.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()
console.log('route path: ', route.path)

// routes this template/page supports:
const routeNameToSlugMap = {
  '/collections/la-rebellion': 'la-rebellion',
  '/collections/in-the-life': 'in-the-life'
}

console.log('slug: ', routeNameToSlugMap[route.path])

const { data, error } = await useAsyncData(`collections-story-${route.path}`, async () => {
  // lookup slug based on routeNameToSlugMap
  const data = await $graphql.default.request(FTVACollectionStory, { slug: routeNameToSlugMap[route.path] })
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entry) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

// DATA
const page = ref(_get(data.value, 'entry', {}))

console.log('page data: ', page.value)

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
})

// IMAGE
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

definePageMeta({
  layout: 'default',
  path: '/collections/la-rebellion',
  alias: ['/collections/in-the-life']
})

useHead({
  title: page.value ? page.value.title : '... loading',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: removeTags(page.value.summary)
    }
  ]
})

const h2Array = ref([]) // anchor tags

onMounted(() => {
  if (import.meta.client) {
    // Directly access headers assuming the DOM is ready
    h2Array.value = getHeaders()
  }
})

const pageClass = computed(() => {
  return ['page', 'page-detail', 'page-detail--paleblue', 'page-storytelling', route.path.replace('/collections/', '')]
})
</script>

<template>
  <main
    id="main"
    :class="pageClass"
  >
    <div class="one-column">
      <NavBreadcrumb
        :title="page.title"
        data-test="breadcrumb"
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

      <PageAnchor
        v-if="h2Array.length >= 3"
        :section-titles="h2Array"
      />

      <TwoColLayoutWStickySideBar
        data-test="second-column"
        class="two-column"
      >
        <template #primaryTop>
          <CardMeta
            category="Collection"
            :title="page?.title"
          />
          <SectionWrapper theme="paleblue">
            <DividerWayFinder />
          </SectionWrapper>
        </template>

        <!-- <template #primaryMid>
          <FlexibleBlocks
            class="flexible-content"
            :blocks="page.blocks"
          />
        </template> -->
      </TwoColLayoutWStickySideBar>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/slug-pages.scss';

.page-storytelling {

  :deep(figure.image--full) {
    margin: 0;
  }
}
</style>
