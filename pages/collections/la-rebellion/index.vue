<script setup>

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionStory from '../gql/queries/FTVACollectionStory.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

/** 1) Normalize the path once (remove trailing slash), keep '/' for root */
const normalizedPath = computed(() => {
  const p = route.path.replace(/\/+$/, '')
  return p === '' ? '/' : p
})

// routes this template/page supports:
const routeNameToSlugMap = {
  '/collections/la-rebellion': 'la-rebellion',
  '/collections/in-the-life': 'in-the-life'
}
const sectionHandle = computed(() => routeNameToSlugMap[normalizedPath.value])
const { data, error } = await useAsyncData(`collections-story-${normalizedPath.value}`, async () => {
  // lookup slug based on routeNameToSlugMap
  const data = await $graphql.default.request(FTVACollectionStory, { slug: sectionHandle.value })
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

// TODO This is creating an index of the content for ES search
if (data.value.entry && import.meta.prerender) {
  // Call the composable to use the indexing function
  const { indexContent } = useContentIndexer()
  const doc = {
    title: data.value.entry.title,
    titleSort: normalizeTitleForAlphabeticalBrowseBy(data.value.entry.title),
    text: data.value.entry.summary,
    uri: route.path,
    sectionHandle: data.value.entry.sectionHandle,
    ftvaCollectionType: data.value.entry.ftvaCollectionType,
    groupName: 'Collections',
  }

  await indexContent(doc, routeNameToSlugMap[normalizedPath.value])
}

// DATA
const page = ref(_get(data.value, 'entry', {}))
const additionalResources = ref(page.value.ftvaAdditionalResources)

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
  additionalResources.value = page.value.ftvaAdditionalResources
}, { deep: true })

// IMAGE
const parsedImage = computed(() => {
  return page.value.imageCarousel
})

// TRANSFORM DATA FOR CAROUSEL
const parsedCarouselData = computed(() => {
  // map image to item, map creditText to credit
  return parsedImage.value.map((rawItem, index) => {
    return {
      item: [{ ...rawItem.image[0], kind: 'image' }], // Carousels on this page are always images, no videos
      credit: rawItem?.creditText,
    }
  })
})

const parsedAdditionalResources = computed(() => {
  if (additionalResources.value.length === 0) return null

  return additionalResources.value.map((obj) => {
    return {
      title: obj.title,
      to: `/${obj.uri}`,
      image: parseImage(obj)
    }
  })
})

definePageMeta({
  layout: 'default',
  path: '/collections/la-rebellion',
  alias: ['/collections/la-rebellion/', '/collections/in-the-life', '/collections/in-the-life/']
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

const pageClasses = computed(() => {
  return ['page', 'page-detail', 'page-detail--paleblue', 'page-storytelling', route.path.replace('/collections/', ''), 'page-bottom-spacer']
})
</script>

<template>
  <main
    id="main"
    :class="pageClasses"
  >
    <div class="one-column">
      <NavBreadcrumb
        :title="page.title"
        data-test="breadcrumb"
      />

      <ResponsiveImage
        v-if="parsedImage && parsedImage.length === 1 && parsedImage[0]?.image && parsedImage[0]?.image?.length === 1"
        data-test="hero-image"
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

      <TwoColLayoutWStickySideBar
        data-test="second-column"
        class="two-column"
      >
        <template #primaryTop>
          <CardMeta
            category="Collection"
            data-test="page-heading"
          >
            <template #anyTitle>
              <h1 class="title-no-link">
                {{ page?.title }}
              </h1>
            </template>
          </CardMeta>
          <SectionWrapper theme="paleblue">
            <DividerWayFinder />
          </SectionWrapper>
        </template>

        <!-- Sidebar -->
        <template #sidebarPageAnchor>
          <PageAnchor
            v-if="h2Array.length >= 3"
            :section-titles="h2Array"
          />
        </template>

        <!-- Primary Mid -->
        <template #primaryMid>
          <FlexibleBlocks
            class="flexible-content"
            :blocks="page.blocks"
            data-test="flexible-blocks-content"
          />
          <SectionWrapper
            v-if="parsedAdditionalResources"
            section-title="Related Resources"
            class="section-wrapper-post-small"
          >
            <SectionPostSmall
              v-if="parsedAdditionalResources"
              :items="parsedAdditionalResources"
              :full-width="true"
            />
          </SectionWrapper>
        </template>
      </TwoColLayoutWStickySideBar>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/slug-pages.scss';
@import 'assets/styles/general-pages.scss';
@import 'assets/styles/page-anchor.scss';

.page-storytelling {
  :deep(.card-with-image) {
    .block-highlight {
      max-width: 100%;
    }

    .block {
      width: calc((100% - 32px) / 2);
    }

    @media #{$small} {
      .block {
        width: 100%;
      }
    }
  }

  :deep(.carousel),
  :deep(.lightbox .media-item),
  :deep(.one-column .responsive-image) {
    height: 100%;
    aspect-ratio: 16/7;
  }

  :deep(.section-wrapper-post-small) {
    #additional-materials {
      scroll-margin-top: 70px;
    }

    .section-title {
      @include ftva-h5;
      color: $heading-grey;
    }

    .block-post-small {
      background: var(--pale-blue);
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

  @media #{$medium} {
    :deep(.carousel),
    :deep(.lightbox .media-item),
    :deep(.one-column .responsive-image) {
      aspect-ratio: 343/204;
    }
  }
}
</style>
