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
  '/instructional-media-collections-services': 'ftvaInstructionalMediaCollectionsAndServices'
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

// DATA
const page = ref(_get(data.value, 'entry', {}))

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
})

// PAGE SUMMARY
const showPageSummary = computed(() => {
  return page.value?.summary && page.value?.displaySummary === 'yes'
})

const pageClass = computed(() => {
  return ['page', 'page-detail', 'page-detail--paleblue', route.name]
})

// TODO MOVE TO GLOBAL UTILS, find and remove others
// Get data for Image or Carousel at top of page
// TODO WHAT ABOUT ftvaimage = map to image?
const parsedImage = computed(() => {
  return page.value.imageCarousel
  // todo add logic to check for image field if no carousel?
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
// END TODO

// TODO MOVE TO A UTIL
// infoblocks reform
const parsedFlexibleBlocks = computed(() => {
  return page.value.blocks.map((block) => {
    // check for infoblock
    if (block.typeHandle !== 'infoBlock') {
      return block
    }

    //if found reformat
    // const reformat = ref({
    //   ...block,
    //   infoBlock: [{
    //     ...block.infoBlock[0],
    //     id: block.id
    //   }]
    // })
    // console.log('reformat', reformat)
    return {
      ...block,
      infoBlock: [{
        ...block.infoBlock[0],
        id: block.id
      }]
    }
  })
})

// item in data currently
const item = {
  id: "3761992",
  typeHandle: "infoBlock",
  infoBlock: [{
    typeHandle: "contactInfoBlock",
    email: "arsc@cinema.ucla.edu",
    phone: "+1 310-206-5388",
    address: "<p translate=\"no\">\n<span class=\"address-line1\">University of California, Los Angeles</span><br>\n<span class=\"address-line2\">Powell Library (Room 46)</span><br>\n<span class=\"locality\">Los Angeles</span>, <span class=\"administrative-area\">CA</span> <span class=\"postal-code\">90095-1517</span><br>\n<span class=\"country\">United States</span>\n</p>"
  }]
}

const mockContactInfoBlock = {
  id: '3726206',
  typeHandle: 'infoBlock',
  infoBlock: [
    {
      typeHandle: 'contactInfoBlock',
      id: '3726207',
      email: 'archive@email.com',
      phone: '+1 323-555-1234',
      address: '<p translate="no">\n<span class="address-line1">722 California Ave</span><br>\n<span class="locality">Glendale</span>, <span class="administrative-area">CA</span> <span class="postal-code">90210</span><br>\n<span class="country">United States</span>\n</p>'
    }
  ]
}
//
// { "id": "3761987", "typeHandle": "infoBlock", "infoBlock": [{ "typeHandle": "infoBlock", "icon": "icon-ftva-download", "heading": "MONDAY - FRIDAY, 9 A.M. TO 5 P.M.", "text": "<p>Hours are subject to change. Requests to view materials must be arranged in advance.</p>" }] }

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
        v-else-if="parsedCarouselData && parsedCarouselData.length > 0 && parsedImage[0].image.length !== 0"
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
      <!-- TODO END -->
    </div>
    <SectionWrapper
      :section-title="page.title"
      class="header"
      data-test=""
    >
      <template v-if="showPageSummary">
        <RichText :rich-text-content="page.summary" />
      </template>
    </SectionWrapper>

    <FlexibleBlocks
      class="flexible-content"
      :blocks="page.blocks"
    />
    <!-- {{ parsedFlexibleBlocks }} -->
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