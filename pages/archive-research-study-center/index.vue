<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAARSCIMCS from '../gql/queries/FTVAEntryARSCIMCS.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()
// routes this page supports:
const routeNameToSectionMap = {
  '/archive-research-study-center': 'ftvaArchiveResearchAndStudyCenter',
  '/instructional-media-collections-services': 'ftvaInstructionalMediaCollectionsAndServices',
  '/archive-research-study-center/': 'ftvaArchiveResearchAndStudyCenter',
  '/instructional-media-collections-services/': 'ftvaInstructionalMediaCollectionsAndServices'
}
const { data, error } = await useAsyncData(route.path, async () => {
  // lookup section based on routeNameToSectionMap
  const data = await $graphql.default.request(FTVAARSCIMCS, { section: routeNameToSectionMap[route.path] })
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

// METADATA INFO
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    const doc = {
      title: data.value.entry.title,
      text: data.value.entry.summary,
      uri: route.path,
      sectionHandle: routeNameToSectionMap[route.path]?.sectionName,
      groupName: 'General Content',
    }
    // Index the collection type data using the composable during static build
    await indexContent(doc, route.path.replaceAll('/', '--'))
    // console.log('Collection type listing indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX ' + route.path + ' during static build:', error)
  }
}

// DATA
const page = ref(_get(data.value, 'entry', {}))

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
})

const pageClass = computed(() => {
  return ['page', 'page-detail', 'page-detail--paleblue', route.path.slice(1)]
})

const parsedImage = computed(() => {
  return page.value.imageCarousel
})

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
  path: '/archive-research-study-center',
  alias: ['/instructional-media-collections-services']
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
</script>
<template>
  <main
    id="main"
    :class="pageClass"
  >
    <div class="one-column">
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
        v-else-if="parsedCarouselData && parsedCarouselData.length > 0 && parsedImage[0]?.image && parsedImage[0].image.length !== 0"
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
    <SectionWrapper
      :section-title="page.title"
      class="header"
      data-test=""
    />

    <FlexibleBlocks
      class="flexible-content"
      :blocks="page.blocks"
    />
  </main>
</template>
<style lang="scss" scoped>
@import 'assets/styles/slug-pages.scss';

.one-column {

  // if the layout has an image or carousel at the top
  &:has(> .lightbox-container),
  &:has(> figure) {
    padding-top: 80px; // to account for the missing pageanchor on this layout
  }
}
</style>
