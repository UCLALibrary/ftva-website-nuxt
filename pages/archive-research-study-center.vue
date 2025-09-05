<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAARSCIMCS from '../gql/queries/FTVAEntryARSCIMCS.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

/** 1) Normalize the path once (remove trailing slash), keep '/' for root */
const normalizedPath = computed(() => {
  const p = route.path.replace(/\/+$/, '')
  return p === '' ? '/' : p
})

/** 2) Map canonical paths only (no trailing slashes) */
const routeToSection = {
  '/archive-research-study-center': 'ftvaArchiveResearchAndStudyCenter',
  '/instructional-media-collections-services': 'ftvaInstructionalMediaCollectionsAndServices',
}

const sectionHandle = computed(() => routeToSection[normalizedPath.value])

/** 3) Use normalized path for the async key (stable between /foo and /foo/) */
const { data, error } = await useAsyncData(normalizedPath.value, async () => {
  if (!sectionHandle.value) {
    // No match → 404
    throw createError({ statusCode: 404, statusMessage: 'Page Not Found', fatal: true })
  }
  const res = await $graphql.default.request(FTVAARSCIMCS, { section: sectionHandle.value })
  return res
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
      sectionHandle: sectionHandle.value,
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

/** 7) Make a safe, CSS-friendly class from the path */
const pageClass = computed(() => {
  const slugClass = normalizedPath.value.slice(1).replaceAll('/', '-')
  return ['page', 'page-detail', 'page-detail--paleblue', slugClass]
})
/** 5) Always return an array */
const parsedImage = computed(() => Array.isArray(page.value?.imageCarousel) ? page.value.imageCarousel : [])

/** 5 & 6) Guard and use consistent prop name 'credit' throughout */
const parsedCarouselData = computed(() => {
  if (!Array.isArray(parsedImage.value) || parsedImage.value.length === 0) return []
  return parsedImage.value.map((rawItem) => {
    const firstImage = rawItem?.image?.[0]
    return {
      item: firstImage ? [{ ...firstImage, kind: 'image' }] : [],
      credit: rawItem?.creditText ?? '', // keep 'credit' as the single source of truth
    }
  })
})
/** 4) Canonical path + aliases for alternates */
definePageMeta({
  layout: 'default',
  path: '/archive-research-study-center',
  alias: ['/archive-research-study-center/', '/instructional-media-collections-services', '/instructional-media-collections-services/']
})

const headTitle = computed(() => page.value?.title || 'Loading ...')

useHead({
  title: headTitle.value,
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: computed(() => page.value?.summary ? removeTags(page.value.summary) : '')
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
        v-show="parsedImage && parsedImage.length === 1 && parsedImage[0]?.image && parsedImage[0]?.image?.length === 1"
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
        v-show="parsedCarouselData && parsedCarouselData.length > 1"
        class="lightbox-container"
      >
        <FlexibleMediaGalleryNewLightbox
          data-test="image-carousel"
          :items="parsedCarouselData"
          :inline="true"
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
