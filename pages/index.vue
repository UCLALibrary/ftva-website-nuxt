<script setup>
// HELPERS
import _get from 'lodash/get'
import { useWindowSize } from '@vueuse/core'
import { format } from 'date-fns'

// GQL
import FTVAHomepage from '../gql/queries/FTVAHomepage.gql'

// UTILITIES
import formatEventDates from '@/utils/formatEventDates'
import formatSeriesDates from '@/utils/formatEventSeriesDates'

const { $graphql } = useNuxtApp()

// STATE
const isMobile = ref(false)

const { data, error } = await useAsyncData('home-page', async () => {
  const data = await $graphql.default.request(FTVAHomepage)
  return data
})

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode, statusMessage: error.value.statusMessage + error.value, fatal: true
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
      uri: '/',
      groupName: 'General Content',
    }
    // Index the articles data using the composable during static build
    await indexContent(doc, 'homepage')
    // console.log('Homepage content indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX HOMEPAGE during static build:', error)
  }
}

const page = ref(_get(data.value, 'entry', {}))

watch(data, (newVal, oldVal) => {
  // eslint-disable-next-line no-console
  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'entry', {})
})

// HANDLE WINDOW SIZING
const { width } = useWindowSize()
watch(width, (newWidth) => {
  const wasMobile = isMobile.value

  isMobile.value = newWidth <= 750
}, { immediate: true })

const parsedCarouselData = computed(() => {
  if (page.value.ftvaFeaturedEntries.length === 0)
    return null

  return page.value.ftvaFeaturedEntries.map((obj) => {
    return {
      item: parseFTVACarouselImage(obj.ftvaImage),
      tag: parseFTVATypeHandles(obj.typeHandle),
      captionText: obj.ftvaHomepageDescription,
      captionTitle: obj.title,
      itemDate: parseDatesAndTimes(obj.typeHandle, obj.startDate, obj.endDate, obj.startDateWithTime, obj.ongoing)
    }
  })
})

const parsedNowShowing = computed(() => {
  if (!Array.isArray(page.value.ftvaFeaturedEventsSection?.[0]?.featuredEvents)) {
    return null
  }

  return page.value.ftvaFeaturedEventsSection[0].featuredEvents.map((item, index) => {
    return {
      ...item,
      to: `/${item.uri}`,
      image: item.ftvaImage && item.ftvaImage.length > 0 ? item.ftvaImage[0] : null,
      startDate: item.startDateWithTime || item.startDate,
    }
  })
})

const parsedQuickLinks = computed(() => {
  if (page.value.ftvaQuickLinks.length === 0)
    return null

  return page.value.ftvaQuickLinks.map((item) => {
    return {
      title: item.titleGeneral,
      to: item.urlLink,
      text: item.description,
      image: item.image[0],
    }
  })
})

const parsedArchiveBlogs = computed(() => {
  if (page.value.ftvaFeaturedArticlesSection.length === 0)
    return null

  const obj = page.value.ftvaFeaturedArticlesSection[0]
  return {
    sectionTitle: obj.sectionTitle,
    sectionCta: obj.seeAllText,
    blogTitle: obj.featuredArticles[0]?.title,
    blogUri: obj.featuredArticles[0].uri,
    blogSummary: obj.featuredArticles[0].ftvaHomepageDescription,
    image: obj.featuredArticles[0].ftvaImage
  }
})

const parsedFeaturedCollections = computed(() => {
  if (page.value.ftvaFeaturedCollectionsSectionSingle.length === 0)
    return null

  const collections = page.value.ftvaFeaturedCollectionsSectionSingle[0].featuredCollections.map((item) => {
    return {
      title: item.title,
      to: item.uri,
      image: item.imageCarousel && item.imageCarousel.length > 0 ? item.imageCarousel[0].image[0] : null,
    }
  })

  return {
    sectionTitle: page.value.ftvaFeaturedCollectionsSectionSingle[0].sectionTitle,
    sectionSummary: page.value.ftvaFeaturedCollectionsSectionSingle[0].sectionDescription,
    sectionCta: page.value.ftvaFeaturedCollectionsSectionSingle[0].seeAllText,
    collections
  }
})

const parsedPreservationData = computed(() => {
  if (page.value.beforeAfterImageCarousel.length === 0)
    return null

  return {
    sectionTitle: page.value.sectionTitle,
    sectionSummary: page.value.richTextSimplified,
    sectionUri: page.value.ftvaRelatedResources,
    beforeImage: page.value.beforeAfterImageCarousel[0]?.beforeImage[0] || null,
    afterImage: page.value.beforeAfterImageCarousel[0]?.afterImage[0] || null,
    caption: page.value.beforeAfterImageCarousel[0]?.caption,
  }
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

// Helpers to parse Carousel
function parseFTVACarouselImage(imgObj) {
  return [{
    ...imgObj[0],
    src: imgObj[0]?.url,
    kind: 'image', // This key is expected by the Media component
  }]
}

function parseFTVATypeHandles(str) {
  // Add extra typehandles as needed
  switch (str) {
    case 'ftvaEvent':
      return 'Event'
    case 'ftvaArticle':
      return 'Article'
    case 'eventSeries':
      return 'Series'
    default:
      return null
  }
}

function formatEventTime(date) {
  const formattedTime = format(new Date(date), 'h:mm aaa')
  return formattedTime.toUpperCase()
}

function parseDatesAndTimes(typeHandle, startDate, endDate, startDateWithTime, ongoing) {
  if (ongoing)
    return 'Ongoing'
  if (typeHandle === 'ftvaEvent')
    return `${formatEventDates(startDateWithTime, startDateWithTime, 'longWithYear')} - ${formatEventTime(startDateWithTime)}`
  if (typeHandle === 'eventSeries')
    return formatSeriesDates(startDate, endDate, 'longWithYear')

  return null
}
</script>

<template>
  <main
    id="main"
    class="page page-home"
  >
    <div class="one-column">
      <div
        v-if="parsedCarouselData"
        class="lightbox-container"
      >
        <FlexibleMediaGalleryNewLightbox
          class="homepage"
          :items="parsedCarouselData"
          :inline="true"
          data-test="homepage-carousel"
        >
          <template #default="slotProps">
            <BlockTag :label="parsedCarouselData[slotProps.selectionIndex].tag" /> {{
              parsedCarouselData[slotProps.selectionIndex].itemDate }}
          </template>
        </FlexibleMediaGalleryNewLightbox>
      </div>

      <!-- Now Showing -->
      <SectionWrapper
        v-if="parsedNowShowing"
        :section-title="page.ftvaFeaturedEventsSection[0].sectionTitle"
        class="now-showing-section no-padding"
        theme="paleblue"
      >
        <template #top-right>
          <nuxt-link to="/events">
            {{ page.ftvaFeaturedEventsSection[0].seeAllText }} <span style="font-size:1.5em;">
              &#8250;</span>
          </nuxt-link>
        </template>
        <ScrollWrapper class="homepage-scroll-wrapper">
          <SectionTeaserCard
            v-if="parsedNowShowing && parsedNowShowing.length > 0"
            class="now-showing-items hovered-items"
            :items="parsedNowShowing"
            :grid-layout="false"
            data-test="featured-event-items"
          />
        </ScrollWrapper>
        <DividerWayFinder />
      </SectionWrapper>

      <!-- Visit and Learn -->
      <SectionWrapper
        v-if="parsedQuickLinks"
        class="visit-learn-section no-padding"
        theme="paleblue"
        :section-title="page.visitAndLearnSectionTitle"
      >
        <div v-if="isMobile">
          <BlockPostSmall
            v-for="(item) in parsedQuickLinks"
            :key="item.to"
            :to="item.to"
            :image="item.image"
            class="quicklink-item-mobile"
          >
            <template #title>
              {{ item.title }}
            </template>
            <template #author>
              {{ item.text }}
            </template>
          </BlockPostSmall>
        </div>
        <div v-else>
          <SectionTeaserCard
            :items="parsedQuickLinks"
            :grid-layout="false"
            data-test="quick-link-items"
          />
        </div>
        <DividerWayFinder />
      </SectionWrapper>

      <!-- Archive Blogs -->
      <SectionWrapper
        v-if="parsedArchiveBlogs"
        :section-title="parsedArchiveBlogs.sectionTitle"
        class="archive-blog-section no-padding"
        theme="paleblue"
      >
        <template #top-right>
          <nuxt-link to="/blog">
            {{ parsedArchiveBlogs.sectionCta }} <span style="font-size:1.5em;">
              &#8250;</span>
          </nuxt-link>
        </template>
        <BlockMediaWithText
          :section-header="parsedArchiveBlogs.blogTitle"
          :short-description="parsedArchiveBlogs.blogSummary"
          button-text="Continue Reading"
          :button-url="parsedArchiveBlogs.blogUri"
          :cover-image="parsedArchiveBlogs.image"
          data-test="featured-article"
        />
        <DividerWayFinder />
      </SectionWrapper>

      <!-- Featured Collections -->
      <SectionWrapper
        v-if="parsedFeaturedCollections"
        :section-title="parsedFeaturedCollections.sectionTitle"
        :section-summary="parsedFeaturedCollections.sectionSummary"
        class="featured-collections-section no-padding"
        theme="paleblue"
      >
        <template #top-right>
          <nuxt-link to="/collections">
            {{ parsedFeaturedCollections.sectionCta }} <span style="font-size:1.5em;">
              &#8250;</span>
          </nuxt-link>
        </template>

        <ScrollWrapper>
          <SectionTeaserCard
            :items="parsedFeaturedCollections.collections"
            :grid-layout="false"
            data-test="featured-collection-items"
            class="hovered-items"
          />
        </ScrollWrapper>

        <DividerWayFinder />
      </SectionWrapper>

      <!-- Preservation & Restoration-->
      <SectionWrapper
        v-if="parsedPreservationData"
        :section-title="parsedPreservationData.sectionTitle"
        :section-summary="parsedPreservationData.sectionSummary"
        class="preservation-section no-padding"
        theme="paleblue"
      >
        <template #top-right>
          <nuxt-link :to="parsedPreservationData.sectionUri">
            Learn More<span style="font-size:1.5em;">
              &#8250;</span>
          </nuxt-link>
        </template>

        <!-- Slider -->
        <div data-test="preservation-image-slider">
          <ImageSlider
            :before-image="parsedPreservationData.beforeImage"
            :after-image="parsedPreservationData.afterImage"
          >
            <template #captionText>
              {{ parsedPreservationData.caption }}
            </template>
            <template #beforeLabel>
              Paris 1895
            </template>
            <template #afterLabel>
              Paris 2013
            </template>
          </ImageSlider>
        </div>
      </SectionWrapper>
    </div>
  </main>
</template>

<style lang="scss" scoped>
main {
  background-color: var(--pale-blue);
}

.one-column {
  width: 100%;
  margin: 0 auto 65px auto;
}

:deep(.section-wrapper:not(:first-of-type)) {
  &.no-padding {
    padding-top: 0;
  }
}

:deep(.section-wrapper) {
  &.no-padding {
    padding-bottom: 0;
  }
}

.lightbox-container {
  position: relative;
}

:deep(.section-wrapper h2.section-header.section-title) {
  color: $heading-grey;
}

.now-showing-section {
  .now-showing-items {
    background-color: var(--pale-blue);
    padding-top: 0px;

    // START HomePage specific cardmeta styles
    :deep(li.block-highlight) {
      max-width: 340px;
      flex-direction: column-reverse;

      .smart-link.title {
        @include ftva-card-title-1;
        color: $heading-grey;
      }

      .date-time {
        @include ftva-emphasized-subtitle;
        color: $accent-blue;
        margin-bottom: 0px;

        .schedule-item.start-date {
          margin-right: 26px;
        }
      }

      .card-meta {
        height: 275px;
        padding: 40px 30px 25px 30px;
      }

      img.media {
        border-radius: 0 0 10px 10px;
      }

      figure.responsive-image>.sizer {
        padding-bottom: 69% !important; // necessary to overwrite the parsedAspectRatio logic for cardmeta
      }
    }
  }

  .homepage-scroll-wrapper {
    :deep(.v-sheet) {
      background-color: transparent;
    }
  }
}

.now-showing-section,
.featured-collections-section {
  .hovered-items {
    :deep(li.block-highlight) {
      margin-top: 16px;
      transition: margin-top 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        margin-top: 0px;
      }
    }
  }
}

.visit-learn-section {
  :deep(.section-teaser-card) {
    padding-top: 0;
  }

  :deep(.block-highlight .media) {
    border-radius: 12px;
  }

  :deep(.card-meta) {
    min-height: 0;
  }

  :deep(.ftva.card-meta a.title) {
    overflow: initial;
    @include ftva-h5;
    color: $heading-grey;

    &:hover {
      text-decoration: underline;
      text-decoration-color: #2c91ff;
      text-decoration-thickness: 3px;
      text-underline-offset: 4px;
    }
  }

  .quicklink-item-mobile {
    &:not(:last-child) {
      margin-bottom: 20px;
    }

    position: relative;
    height: 100px;

    :deep(a.block-post-small) {
      background-color: transparent;
      border-radius: 0px;
      min-width: auto;
      min-height: 100px;

      &::after {
        content: url('ucla-library-design-tokens/assets/svgs/icon-caret-right.svg');
        position: absolute;
        filter: brightness(0);
        right: 0;
        top: 35px;
      }

      .image {
        height: 100px;
        width: 100px;
      }

      .title {
        margin-top: 0px;
        @include ftva-h5;
        color: $heading-grey;

        &:hover {
          text-decoration: underline;
          text-decoration-color: #2c91ff;
          text-decoration-thickness: 3px;
          text-underline-offset: 4px;
        }
      }

      .author {
        margin-top: 4px;
        @include ftva-body-2;
      }

      &:hover {
        box-shadow: none;
      }
    }
  }
}

.visit-learn-section.ftva.section-wrapper.top-level.theme-paleblue {
  :deep(.block-highlight.card) {
    background-color: transparent;
  }
}

.featured-collections-section {
  .section-teaser-card {
    background-color: var(--pale-blue);
    padding-top: 0;
  }

  :deep(.rich-text.section-summary) {
    @include ftva-body-2;
  }

  :deep(.block-highlight .card-meta) {
    min-height: 0;
  }
}

.preservation-section {
  :deep(.section-header.section-title) {
    margin-bottom: 40px;
  }

  :deep(.rich-text p) {
    @include ftva-body-2;
  }
}

.featured-collections-section,
.preservation-section {
  :deep(.rich-text.section-summary) {
    max-width: 100%;
  }
}

@media #{$medium} {
  :deep(.ftva.section-wrapper div.section-header) {
    margin-bottom: 40px;
  }
}

@media #{$small} {
  .archive-blog-section {
    :deep(.media-with-text) {
      margin-top: 16px;
      max-height: unset;
    }
  }

  .preservation-section {
    :deep(.section-header.section-title) {
      margin-bottom: 10px;
    }

    :deep(.section-header .section-link) {
      margin-bottom: 36px;
    }
  }
}
</style>
