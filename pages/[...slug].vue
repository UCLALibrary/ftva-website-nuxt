<script setup>
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
const { data, error } = await useAsyncData(`general-content-${path.replaceAll('/', '--')}`, async () => {
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
  data.value.entry.titleSort = normalizeTitleForAlphabeticalBrowseBy(data.value.entry.title)
  data.value.entry.groupName = 'General Content'
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

// Parse FlexibleBlock with helper
const parsedFlexibleBlocks = computed(() => {
  const dataBlocks = page.value?.blocks || []
  return parseFlexibleBlocks(dataBlocks)
})

const pageClasses = computed(() => {
  return ['page', 'page-detail', 'page-detail--paleblue', 'page-general-content', path, 'page-bottom-spacer']
})

useHead({
  title: page.value ? page.value.title : '... loading'
})

onMounted(() => {
  if (import.meta.client) {
    // Directly access headers assuming the DOM is ready
    h2Array.value = getHeaders()
  }
})
</script>

<template lang="html">
  <main
    id="main"
    :class="pageClasses"
  >
    <div class="one-column">
      <NavBreadcrumb
        :title="page?.title"
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
        <!-- do not use inline=true, if inline is boolean use :inline=true -->

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
          <div>
            <CardMeta>
              <template #anyTitle>
                <!-- eslint-disable vue/no-v-html -->
                <h1
                  v-if="page.formattedTitle"
                  class="title-no-link"
                  v-html="page.formattedTitle"
                />
                <h1
                  v-else
                  class="title-no-link"
                >
                  {{ page?.title }}
                </h1>
              </template>
            </CardMeta>
          </div>
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

        <template #primaryMid>
          <FlexibleBlocks
            class="flexible-content"
            :blocks="parsedFlexibleBlocks"
          />
        </template>
      </TwoColLayoutWStickySideBar>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/slug-pages.scss';
@import 'assets/styles/general-pages.scss';
@import 'assets/styles/page-anchor.scss';

.page-general-content {

  // Apply extra padding to single/solo breadcrumb that has no parent--to keep spacing below nav bar even with other pages
  .nav-breadcrumb> :not(.breadcrumb-wrapper > a.parent-page-url) {
    padding: 10px 0;
  }

  // Rich Text Image
  :deep(figure.image--full) {
    a:after {
      position: absolute;
      right: 10px;
      bottom: -12px;
    }

    figcaption {
      margin: 0px;
      padding: 0px;
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

    .media-with-text .media-item {
      @media #{$small} {
        min-width: unset;
        max-width: 100%;
      }
    }
  }

  @media (max-width: 1200px) {
    .nav-breadcrumb> :not(.breadcrumb-wrapper > a.parent-page-url) {
      padding: 16px 0;
    }

    :deep(figure.image--full) {
      a:after {
        right: 0;
      }
    }
  }
}
</style>
