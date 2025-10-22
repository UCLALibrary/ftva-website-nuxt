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

// Remove country from address
function stripCountry(html) {
  if (!html) return null
  return html.replace(/<span\s+class=["']country["'][^>]*>.*?<\/span>/gs, '')
}

// Remove country data in InfoBlock address
function parseInfoBlockAddress(block) {
  if (!block.infoBlock || block.infoBlock.length === 0)
    return null

  block.infoBlock = block.infoBlock.map((item) => {
    if (item && item.address) {
      return { ...item, address: stripCountry(item.address) }
    }
    return item
  })

  return block
}

// Use internal and external resources, use titleGeneral as SimpleCard title; otherwise, keep default title
// For internal resources, check for leading `ftva/` string in uri and remove
function parseSimpleCard(block) {
  if (!block.cards || block.cards.length === 0)
    return null

  let simpleCards = block.cards

  simpleCards = simpleCards.map((card) => {
    // External Resource
    if (card.typeHandle === 'externalServiceOrResource') {
      if (card.titleGeneral) {
        card = { ...card, title: card.titleGeneral }
      }
    }

    // Internal Resource
    if (card.typeHandle === 'internalServiceOrResource') {
      let content = card.contentLink[0]

      // Check for titleGeneral
      if (content.titleGeneral) {
        content = { ...content, title: content.titleGeneral }
        card = { ...card, contentLink: [content] }
      }

      // Check uri for 'ftva/'
      if (content.uri) {
        const uriWithoutLeadingFtvaString = content.uri ? `/${content.uri.replace(/^\/?ftva\//i, '')}` : '/'
        card = { ...card, uri: uriWithoutLeadingFtvaString }
      }
    }

    return card
  })

  return { ...block, cards: simpleCards }
}

// Parse FlexibleBlock with helper functions
const parsedFlexibleBlocks = computed(() => {
  const dataBlocks = page.value?.blocks || []

  return dataBlocks.map((block) => {
    if (block.typeHandle === 'infoBlock') {
      block = parseInfoBlockAddress(block)
    }

    if (block.typeHandle === 'simpleCards') {
      block = parseSimpleCard(block)
    }

    return block
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

    <SectionWrapper>
      <SectionHeader
        :level="1"
        class="page-heading"
        data-test="page-heading"
      >
        {{ page.title }}
      </SectionHeader>
    </SectionWrapper>

    <FlexibleBlocks
      class="flexible-content"
      :blocks="parsedFlexibleBlocks"
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

.section-header,
:deep(.ftva.flexible-blocks .flexible-block-section-wrapper .section-header .section-title) {
  color: $heading-grey;
}

:deep(.ftva.flexible-blocks .flexible-block-section-wrapper .section-header) {
  margin-bottom: 20px;
}

// TODO section-title should not have section-header class in component (it should have the level, section-header3 is okay)
:deep(.ftva.flexible-blocks .flexible-block-section-wrapper .section-header > .section-header) {
  margin-bottom: 12px;
}

.page-heading {
  @include ftva-h2;
}

:deep(.ftva.flexible-blocks .flexible-block-section-wrapper .section-header .section-title) {
  @include ftva-h4;
}

.instructional-media-collections-services {
  :deep(.flexible-block-section-wrapper:last-child) {
    margin-bottom: 0;
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

    ol,
    ul {
      padding: 0;
    }

    ul {
      li {
        @include ftva-fpb-rich-text-li;
      }
    }
  }
}
</style>
