<script setup>
// HELPERS
import _get from 'lodash/get'
import { useWindowSize } from '@vueuse/core'

// GQL
import FTVAHomepage from '../gql/queries/FTVAHomepage.gql'

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

const page = ref(_get(data.value, 'entry', {}))
console.log('Page: ', page.value)

watch(data, (newVal, oldVal) => {
  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'entry', {})
})

// HANDLE WINDOW SIZING
const { width } = useWindowSize()
watch(width, (newWidth) => {
  const wasMobile = isMobile.value

  isMobile.value = newWidth <= 750
}, { immediate: true })

// Carousel

const parsedNowShowing = computed(() => {
  if (!page.value.ftvaFeaturedEventsSection || !page.value.ftvaFeaturedEventsSection[0].featuredEvents) {
    return []
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
  const obj = page.value.ftvaFeaturedArticlesSection[0]
  return {
    sectionTitle: obj.sectionTitle,
    sectionCta: obj.seeAllText,
    blogTitle: obj.featuredArticles[0].title,
    blogUri: obj.featuredArticles[0].uri,
    // blogSummary: ,
    image: obj.featuredArticles[0].ftvaImage
  }
})

const parsedFeaturedCollections = computed(() => {
  return page.value.ftvaFeaturedEntries.map((item) => {
    return {
      title: item.title,
      to: item.uri,
      image: item.ftvaImage[0],
    }
  })
})

const parsedPreservationData = computed(() => {
  return {
    sectionTitle: page.value.sectionTitle,
    sectionSummary: page.value.richTextSimplified,
    sectionUri: page.value.ftvaRelatedResources,
    // Image
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
</script>

<template>
  <main
    id="main"
    class="page page-home"
  >
    <!-- TODO Carousel Here -->
    <div class="one-column">
      <!-- Now Showing -->
      <SectionWrapper
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
            class="now-showing-items"
            :items="parsedNowShowing"
            :grid-layout="false"
          />
        </ScrollWrapper>
      </SectionWrapper>
      <SectionWrapper
        class="no-padding"
        theme="paleblue"
      >
        <DividerWayFinder />
      </SectionWrapper>

      <!-- Visit and Learn -->
      <SectionWrapper
        class="visit-learn-section no-padding"
        theme="paleblue"
        :section-title="page.visitAndLearnSectionTitle
          "
      >
        <div v-if="isMobile">
          <BlockPostSmall
            v-for="(item, index) in page.ftvaQuickLinks"
            :key="index"
            :to="item.urlLink"
            :image="item.image[0]"
            class="quicklink-item-mobile"
          >
            <template #title>
              {{ item.titleGeneral }}
            </template>
            <template #author>
              {{ item.description }}
            </template>
          </BlockPostSmall>
        </div>
        <div v-else>
          <SectionTeaserCard
            :items="parsedQuickLinks"
            :grid-layout="false"
          />
        </div>
      </SectionWrapper>
      <SectionWrapper
        class="no-padding"
        theme="paleblue"
      >
        <DividerWayFinder />
      </SectionWrapper>

      <!-- Archive Blogs -->
      <SectionWrapper
        :section-title="parsedArchiveBlogs.sectionTitle"
        class="archive-blog-section no-padding"
        theme="paleblue"
      >
        <template #top-right>
          <nuxt-link to="/articles">
            {{ parsedArchiveBlogs.sectionCta }} <span style="font-size:1.5em;">
              &#8250;</span>
          </nuxt-link>
        </template>
        <BlockMediaWithText
          :section-header="parsedArchiveBlogs.blogTitle"
          button-text="Continue Reading"
          :button-url="parsedArchiveBlogs.blogUri"
          :cover-image="parsedArchiveBlogs.image"
        />
      </SectionWrapper>
      <SectionWrapper
        class="no-padding"
        theme="paleblue"
      >
        <DividerWayFinder />
      </SectionWrapper>

      <!-- Featured Collections -->
      <SectionWrapper
        section-title="Featured Collections"
        class="featured-collections-section no-padding"
        theme="paleblue"
      >
        <template #top-right>
          <nuxt-link to="/collections">
            View All Collections <span style="font-size:1.5em;"> &#8250;</span>
          </nuxt-link>
        </template>

        <ScrollWrapper>
          <SectionTeaserCard
            :items="parsedFeaturedCollections"
            :grid-layout="false"
          />
        </ScrollWrapper>
      </SectionWrapper>
      <SectionWrapper
        class="no-padding"
        theme="paleblue"
      >
        <DividerWayFinder />
      </SectionWrapper>

      <!-- Preservation -->
      <SectionWrapper
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
      </SectionWrapper>
    </div>
  </main>
</template>

<style lang="scss" scoped>
main {
  background-color: var(--pale-blue);
}

:deep(.section-wrapper) {
  &.no-padding {
    padding-top: 0;
    padding-bottom: 0;
  }
}

.one-column {
  width: 100%;
  margin: 65px auto;

  :deep(.nav-breadcrumb) {
    padding: 0px;
  }
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
      transition: margin-top 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        margin-top: 0px;
      }

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

.visit-learn-section {
  :deep(.block-highlight.card) {
    background-color: none;
  }

  :deep(.section-teaser-card) {
    padding-top: 0;
  }

  :deep(.card-meta) {
    min-height: 0;
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

.featured-collections-section {
  .section-teaser-card {
    background-color: var(--pale-blue);
    padding-top: 0;
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
