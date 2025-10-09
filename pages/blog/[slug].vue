<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAArticleDetail from '../gql/queries/FTVAArticleDetail.gql'

// COMPOSABLE
import { useContentIndexer } from '~/composables/useContentIndexer'

// UTILS
import removeTags from '~/utils/removeTags'
import { socialList } from '~/utils/socialList'

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

// This is creating an index of the main content (not related content)
if (data.value.ftvaArticle && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the article data using the composable during static build
    data.value.ftvaArticle.titleSort = normalizeTitleForAlphabeticalBrowseBy(data.value.ftvaArticle.title)
    data.value.ftvaArticle.groupName = 'Articles'
    await indexContent(data.value.ftvaArticle, route.params.slug)
    // console.log('Article indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX ARTICLE during static build:', error)
  }
}

const page = ref(_get(data.value, 'ftvaArticle', {}))
const ftvaRecentPosts = ref(_get(data.value, 'ftvaRecentPosts', {}))

watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'ftvaArticle', {})
  ftvaRecentPosts.value = _get(newVal, 'ftvaRecentPosts', {})
})

// COMPUTED
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

// Combine the categories into a String
const parsedArticleCategories = computed(() => {
  if (page.value.articleCategories) {
    return page.value.articleCategories.map(category => category.title).join(', ')
  }
  return ''
})

// Get the Contributor data if it exists, otherwise return nothing
const parsedByline = computed(() => {
  if ((page.value.contributors && page.value.contributors[0]) && page.value.contributors[0].contributor) {
    return page.value.contributors[0].contributor
  }
  return ''
})

// Recent Posts: Filter out the current post and then return the first 3 max
const parsedRecentPosts = computed(() => {
  // fail gracefully if no recent posts
  if (!ftvaRecentPosts.value || !route.params.slug)
    return []

  // Transform data
  const recentPostsWImage = ftvaRecentPosts.value.map((item, index) => {
    return {
      ...item,
      image: parseImage(item)
    }
  })
  return recentPostsWImage.filter(item => !item.to.includes(route.params.slug)).slice(0, 3)
})

useHead({
  title: page.value ? page.value.title : '... loading',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: removeTags(page.value.text)
    }
  ]
})
</script>

<template>
  <main
    id="main"
    class="page page-detail page-detail--paleblue page-article-detail"
  >
    <div class="one-column">
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
    </div>

    <TwoColLayoutWStickySideBar>
      <template #primaryTop>
        <CardMeta
          data-test="text-block"
          :category="parsedArticleCategories"
          :title="page?.title"
          :byline-one="parsedByline"
          :date-created="page?.postDate"
          section-handle="ftvaArticle"
        >
          <template #sharebutton>
            <ButtonDropdown
              button-title="Share"
              :has-icon="true"
              :dropdown-list="socialList.dropdownList"
            />
          </template>
        </CardMeta>

        <h3
          v-if="page?.aboutTheAuthor"
          class="about-the-author"
        >
          About the Author
        </h3>

        <RichText
          v-if="page?.aboutTheAuthor"
          data-test="aboutTheAuthor"
          :rich-text-content="page?.aboutTheAuthor"
        />

        <DividerWayFinder class="remove-top-margin" />

        <FlexibleBlocks
          class="flexible-content"
          :blocks="page.blocks"
        />
      </template>
      <template #sidebarTop />
    </TwoColLayoutWStickySideBar>

    <SectionWrapper
      v-if="parsedRecentPosts && parsedRecentPosts.length > 0"
      section-title="Read our most recent posts"
      theme="paleblue"
    >
      <template #top-right>
        <nuxt-link to="/series">
          View All Series <span style="font-size:1.5em;"> &#8250;</span>
        </nuxt-link>
      </template>
      <SectionTeaserCard
        v-if="parsedRecentPosts && parsedRecentPosts.length > 0"
        data-test="recent-posts"
        :items="parsedRecentPosts"
        :grid-layout="false"
      />
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/slug-pages.scss';

// PAGE STYLES
.page-article-detail {
  position: relative;

  // makes all EventSeries same height
  :deep(.card) {
    min-height: 350px;
  }

  :deep(.two-column) {

    // specs say 832px for column @ 1440px screen
    // 78% is close but not exact while being responsive
    .primary-column {
      width: 78%; // override default 67% for article pages only

      .primary-section-wrapper {
        padding-left: 0px;
        margin-top: var(--space-2xl);
      }

      .section-wrapper {
        margin-top: var(--space-2xl);
      }

      .remove-top-margin {
        margin-top: 0px;
        padding-top: var(--space-l);
      }

    }
  }

  .about-the-author {
    @include ftva-subtitle-2;
    color: $accent-blue;
    padding-bottom: 4px;
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
      ul {
        padding: 0;
      }
      li {
        position: relative;
        padding-left: calc(1rem + 22px);

        &::before {
          position: absolute;
          margin-left: calc(-1rem - 22px);
        }
      }
    }
  }

  @media (max-width: 1200px) {
    .two-column {
      padding-left: var(--unit-gutter);
      padding-right: var(--unit-gutter);
    }

    :deep(.two-column) {
      display: flex;

      // increase column percentage to 100 at 1200px
      // only for article pages, since there is no sidebar content
      .primary-column {
        width: 100%;

        .primary-section-wrapper {
          padding-right: 0px;
        }
      }
    }
  }

  @media #{$small} {
    .two-column {
      display: flex;

      .remove-top-margin {
        margin-top: var(--space-2xl); //re add space as padding for mobile
      }
    }
  }
}
</style>
