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
  if (import.meta.client) {
    // Directly access headers assuming the DOM is ready
    h2Array.value = getHeaders()
  }
})
</script>

<template lang="html">
  <main
    id="main"
    class="page page-detail page-detail--paleblue page-general-content"
  >
    <div class="one-column">
      <NavBreadcrumb data-test="breadcrumb" />

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
          <div v-if="page.formattedTitle">
            <h3 class="page-title">
              <rich-text
                class="page-title-rich-text"
                :rich-text-content="page.formattedTitle"
              />
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
      </TwoColLayoutWStickySideBar>
    </div>
  </main>
</template>

<style lang="scss" scoped>
.page-general-content {

  // Apply extra padding to single/solo breadcrumb that has no parent
  .nav-breadcrumb> :not(.breadcrumb-wrapper > a.parent-page-url) {
    padding: 5px 0;
  }

  .page-title {
    display: block;

    .translation {
      display: block;
    }

    @include ftva-h2;
    color: $heading-grey;
    margin: 0;

    .page-title-rich-text {
      :deep(.parsed-content) {
        @include ftva-h2;
        color: $heading-grey;
      }
    }
  }

  .two-column {
    display: block;
    margin-top: 32px;

    .sidebar-column {
      display: none;
    }

    :deep(.primary-section-wrapper) {
      margin-top: 0;
    }
  }

  // Apply spacing between flexible blocks
  .flexible-blocks.flexible-content {
    :deep(.section-wrapper) {
      margin: var(--space-2xl) auto;
    }

    :deep(.section-header + div .section-wrapper) {
      margin-top: 24px;
    }
  }

  // Flexible Blocks Rich Text Styles
  // added during UX review of page 4/4/2025 - TODO move to FTVA FlexibleBlocks theme?
  .flexible-blocks.flexible-content {

    :deep(.section-wrapper) {
      >a {
        position: relative;
        top: -70px; //offset links in the document by the height of the sticky header
      }
    }

    :deep(figure.image--full) {
      margin-left: 0px;

      a:after {
        position: absolute;
        right: 0px;
        bottom: -12px;
      }

      figcaption {
        margin: 0px;
        padding: 0px;
      }
    }
  }

  // END added rules

  .ftva.page-anchor {
    margin-top: 24px;
    top: 65px; // Sticks anchor after sticky header
  }

  @media (max-width: 1200px) {
    .two-column {
      :deep(.primary-section-wrapper) {
        padding-left: 0;
      }

      :deep(.primary-column) {
        width: 80%;
      }
    }
  }

  @media (max-width: 1024px) {
    .two-column {
      :deep(.primary-column) {
        width: 100%;
      }
    }
  }

  @media (max-width: 900px) {
    .flexible-blocks.flexible-content {
      :deep(.section-header + div .section-wrapper) {
        margin-top: 0;
      }
    }
  }
}

@import 'assets/styles/slug-pages.scss';
</style>
