<script setup>
// COMPONENT RE-IMPORTS
// TODO: remove when we have implemented component library as a module
// https://nuxt.com/docs/guide/directory-structure/components#library-authors
// import { BlockTag, CardMeta, DividerWayFinder, FlexibleMediaGalleryNewLightbox, NavBreadcrumb, ResponsiveImage, RichText, SectionTeaserCard, SectionWrapper } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAArticleDetail from '../gql/queries/FTVAArticleDetail.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`blog-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVAArticleDetail, { slug: route.params.slug })
  return data
})
if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.ftvaArticle) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

const page = ref(_get(data.value, 'ftvaArticle', {}))
const recentposts = ref(_get(data.value, 'ftvaRecentPosts', {}))

watch(data, (newVal, oldVal) => {
  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'ftvaArticle', {})
  page.value = _get(newVal, 'ftvaRecentPosts', {})
})
</script>

<template>
  <main
    id="main"
    class="page page-article-detail"
  >
    <h3>PAGE DATA</h3>
    <pre>{{ page }}</pre>
    <hr>
    <pre>{{ recentposts }}</pre>

    <!-- <div class="one-column">
      <NavBreadcrumb
        class="breadcrumb"
        data-test="breadcrumb"
        :title="page?.title"
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
    data-test="image-carousel"
    :items="parsedCarouselData"
  >
    <template #default="slotProps">
            <BlockTag
              data-test="credit-text"
              :label="parsedCarouselData[slotProps.selectionIndex]?.creditText"
            />
          </template>
  </FlexibleMediaGalleryNewLightbox>
</div>
</div> -->

    <!-- <div
      data-test="second-column"
      class="two-column"
    > -->
    <!-- <div class="primary-column top">
        <SectionWrapper>
          <CardMeta
            data-test="text-block"
            :category="series[0]?.title"
            :title="page?.title"
            :guest-speaker="page?.guestSpeaker"
            :tag-labels="page?.tagLabels"
            :introduction="page?.introduction"
          /> -->

    <!-- <RichText
            v-if="page?.eventDescription"
            data-test="event-description"
            class="eventDescription"
            :rich-text-content="page?.eventDescription"
          /> -->

    <!-- About the Author -->
    <!--  <RichText
            v-if="page?.acknowledements"
            data-test="acknowledgements"
            class="acknowledgements"
            :rich-text-content="page?.acknowledements"
          />
        </SectionWrapper>
      </div>
    </div> -->

    <!-- <SectionWrapper>
      <DividerWayFinder />
    </SectionWrapper>

    <SectionWrapper>
      <FlexibleBlocks
        class="flexible-content"
        :blocks="page.blocks"
      />
    </SectionWrapper>

    <SectionWrapper
      v-if="parsedFtvaEventSeries && parsedFtvaEventSeries.length > 0"
      section-title="Upcoming events in this series"
      theme="paleblue"
    >
      <template #top-right>
        <nuxt-link to="/series">
          View All Series <span style="font-size:1.5em;"> &#8250;</span>
        </nuxt-link>
      </template>

      <SectionTeaserCard
        v-if="parsedFtvaEventSeries && parsedFtvaEventSeries.length > 0"
        data-test="event-series"
        :items="parsedFtvaEventSeries"
      />
    </SectionWrapper> -->
  </main>
</template>

<style
  lang="scss"
  scoped
>
// PAGE STYLES
.page-article-detail {
  position: relative;

  &:before {
    content: '';
    position: absolute;
    background-color: var(--pale-blue);
    aspect-ratio: 1440 / 520;
    max-height: 518px; //prevent overflow on large screens
    min-height: 225px; //prevent too much shrinking on small screens
    width: 100%;
    z-index: -1;
  }

  .one-column {
    width: 100%;
    max-width: var(--max-width);
    margin: 0 auto;

    :deep(.nav-breadcrumb) {
      padding: 0px;
    }
  }

  .two-column {
    position: relative;
    width: 100%;
    max-width: var(--max-width);
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;

    .primary-column {
      margin-bottom: 0px;
      width: 67%;

      .section-wrapper {
        padding-left: 0px;
      }

      &.bottom {
        margin-top: -30px;
      }
    }

    .ftva.button-dropdown {
      margin-top: 30px;
    }

    .ftva.block-info {
      margin-top: 48px;
    }

    // SECTION SCREENING DETAILS
    // TODO when component is patched, remove styles?
    :deep(figure.responsive-video:not(:has(.video-embed))) {
      display: none;
    }

    .sidebar-column {
      min-width: 314px;
      width: 30%;
      position: absolute;
      height: 100%;
      top: 0;
      right: 0;
      padding-top: var(--space-2xl);
      padding-bottom: 20px;

      .sidebar-content-wrapper {
        position: sticky;
        top: 85px;
        will-change: top;
      }
    }
  }

  /* makes all EventSeries same height */
  :deep(.card) {
    min-height: 350px;
  }

  @media (max-width: 1200px) {

    .one-column,
    .two-column {
      padding-left: var(--unit-gutter);
      padding-right: var(--unit-gutter);
    }

    .sidebar-column {
      padding-right: var(--unit-gutter);
    }

    .two-column>.primary-column {
      width: 62%;
    }
  }

  @media #{$small} {
    .two-column {
      display: grid;
      grid-template-columns: 1fr;

      .primary-column {
        width: auto;
        grid-column: 1;

        .section-wrapper {
          padding-left: var(--unit-gutter);
        }

        &.bottom {
          margin-top: auto;
        }
      }

      .sidebar-column {
        width: auto;
        position: relative;
        grid-column: 1;
        margin: auto var(--unit-gutter);
        padding-top: 0px;
        height: auto; // let content determine height on mobile
      }
    }
  }
}
</style>
