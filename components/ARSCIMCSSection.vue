<script setup lang="ts">
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAARSCIMCS from '../gql/queries/FTVAEntryARSCIMCS.gql'

type SectionHandle =
  | 'ftvaArchiveResearchAndStudyCenter'
  | 'ftvaInstructionalMediaCollectionsAndServices'

const props = defineProps<{
  sectionHandle: SectionHandle
  canonicalPath: string // e.g. '/archive-research-study-center' or '/instructional-media-collections-services'
}>()

const { $graphql } = useNuxtApp()


const { data, error } = await useAsyncData(props.canonicalPath, async () => {
  if (!props.sectionHandle) {
    // No match → 404
    throw createError({ statusCode: 404, statusMessage: 'Page Not Found', fatal: true })
  }
  const res = await $graphql.default.request(FTVAARSCIMCS, { section: props.sectionHandle })
  return res
}) as { data: Ref<{ entry: any } | null>, error: Ref<any> }

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value?.entry) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

// METADATA INFO
if (data.value?.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    const doc = {
      title: data.value.entry.title,
      titleSort: normalizeTitleForAlphabeticalBrowseBy(data.value.entry.title),
      text: data.value.entry.summary,
      uri: props.canonicalPath,
      sectionHandle: props.sectionHandle,
      groupName: 'General Content',
    }
    // Index the collection type data using the composable during static build
    await indexContent(doc, props.canonicalPath.replaceAll('/', '--'))
    // console.log('Collection type listing indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX ' + props.canonicalPath + ' during static build:', error)
  }
}

// DATA
const page = ref(_get(data.value, 'entry', {}))

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
})

// remove country from address
function stripCountry(html) {
  if (!html) return null
  return html.replace(/<span\s+class=["']country["'][^>]*>.*?<\/span>/gs, '')
}

// clean page data of country in address
const pageBlocksNoCountry = computed(() => {
  const dataBlocks = page.value?.blocks || []

  return dataBlocks.map((block) => {
    const blockCopy = { ...block }

    let infoBlock = blockCopy.infoBlock

    // If infoBlock is missing, default to an empty array
    if (!infoBlock) {
      infoBlock = []
    }

    // Create a new array by mapping over infoBlock
    blockCopy.infoBlock = infoBlock.map((item) => {
      if (item && item.address) {
        return { ...item, address: stripCountry(item.address) }
      }
      return item
    })

    return blockCopy
  })
})

/** 7) Make a safe, CSS-friendly class from the path */
const pageClasses = computed(() => {
  const slugClass = props.canonicalPath.slice(1).replaceAll('/', '-')
  return ['page', 'page-detail', 'page-detail--paleblue', slugClass, 'page-bottom-spacer']
})
/** 5) Always return an array */
const parsedImage = computed(() => Array.isArray(page.value?.imageCarousel) ? page.value.imageCarousel : [])

interface FtvaImage {
  // adapt to your actual image fields as needed
  [k: string]: unknown
}
type ParsedCarouselItem = {
  item: Array<FtvaImage & { kind: 'image' }>
  creditText: string
}
/** 5 & 6) Guard and use consistent prop name 'credit' throughout */
const parsedCarouselData = computed<ParsedCarouselItem[]>(() => {
  if (!Array.isArray(parsedImage.value) || parsedImage.value.length === 0) return []
  return parsedImage.value.map((rawItem) => {
    const firstImage = rawItem?.image?.[0]
    return {
      item: firstImage ? [{ ...firstImage, kind: 'image' }] : [],
      creditText: rawItem?.creditText ?? '',
    }
  })
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
    :class="pageClasses"
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
      :blocks="pageBlocksNoCountry"
    />
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/slug-pages.scss';

.archive-research-study-center {
  .one-column {

    // if the layout has an image or carousel at the top
    &:has(> .lightbox-container),
    &:has(> figure) {
      padding-top: 80px; // to account for the missing pageanchor on this layout
    }
  }

  .flexible-content {
    :deep(div:last-of-type .section-wrapper3) {
      margin-bottom: 0;
    }
  }
}

/* remove max-width from rich-text inside flexible-blocks for ftva */
:deep(.flexible-block) {
  .rich-text {
    max-width: none;
    padding-right: 0px;

    h3 {
      @include ftva-fpb-rich-text-h3;
    }

    h4 {
      @include ftva-fpb-rich-text-h4;
    }

    h5 {
      @include ftva-fpb-rich-text-h5;
    }
  }
}
</style>
