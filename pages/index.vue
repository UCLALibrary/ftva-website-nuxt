<script lang="ts" setup>
// HELPERS
import _get from 'lodash/get'
import { useWindowSize } from '@vueuse/core'

// GQL
import FTVAHomepage from '../gql/queries/FTVAHomepage.gql'

const { $graphql } = useNuxtApp()
const route = useRoute()

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

// const parsedAdvancedSearchLink = computed(() => {
//   // Last item in searchLinks
//   const advancedLink = page.value.searchLinks.slice(-1)[0]
//   return advancedLink
// })
// const parsedSearchLinks = computed(() => {
//   // Remove last item in searchLinks
//   const searchLinks = [...page.value.searchLinks].slice(0, -1)
//   return searchLinks
// })

// const parsedGetHelpWith = computed(() => {
//   return page.value.getHelpWith[0].getHelpWith.map((obj) => {
//     return {
//       ...obj,
//       to: obj.externalResourceUrl
//         ? obj.externalResourceUrl
//         : `/${obj.uri}`,
//     }
//   })
// })
// const bannerFeaturedEvent = computed(() => {
//   const bannerFeaturedEvent = page.value.featuredEvents[0]
//   return {
//     ...bannerFeaturedEvent,
//     to: `/${bannerFeaturedEvent.uri}`,
//     title:
//       bannerFeaturedEvent.sectionHandle
//         === 'workshopOrEventSeries'
//         ? bannerFeaturedEvent.title
//         : bannerFeaturedEvent.eventTitle,
//     prompt:
//       bannerFeaturedEvent.sectionHandle
//         === 'workshopOrEventSeries'
//         ? 'View series'
//         : `View ${bannerFeaturedEvent.sectionHandle}`,
//     image: _get(bannerFeaturedEvent, 'heroImage[0].image[0]', null),
//     startDate:
//       bannerFeaturedEvent.sectionHandle === 'event'
//         ? _get(bannerFeaturedEvent, 'startDateWithTime', null)
//         : _get(bannerFeaturedEvent, 'startDate', null),
//     endDate:
//       bannerFeaturedEvent.sectionHandle === 'event'
//         ? _get(bannerFeaturedEvent, 'endDateWithTime', null)
//         : _get(bannerFeaturedEvent, 'endDate', null),
//     category: _get(bannerFeaturedEvent, 'category[0].title', ''),
//     description:
//       bannerFeaturedEvent.sectionHandle === 'event'
//         ? _get(bannerFeaturedEvent, 'eventDescription', '')
//         : _get(bannerFeaturedEvent, 'summary', ''),
//     locations:
//       bannerFeaturedEvent.associatedLocations[0] != null
//         ? bannerFeaturedEvent.associatedLocations
//         : bannerFeaturedEvent.eventLocation,
//   }
// })
// // TO DO need to update dates on component
// const parsedDualMasonryEvents = computed(() => {
//   const masonaryEvents = page.value.featuredEvents.slice(1, 3)
//   return masonaryEvents.map((obj) => {
//     return {
//       ...obj,
//       to: `/${obj.uri}`,
//       title:
//         obj.sectionHandle === 'workshopOrEventSeries'
//           ? obj.title
//           : obj.eventTitle,
//       image: _get(obj, 'heroImage[0].image[0]', null),
//       startDate:
//         obj.sectionHandle === 'event'
//           ? _get(obj, 'startDateWithTime', null)
//           : _get(obj, 'startDate', null),
//       endDate:
//         obj.sectionHandle === 'event'
//           ? _get(obj, 'endDateWithTime', null)
//           : _get(obj, 'endDate', null),
//       category: 'Featured',
//       prompt:
//         obj.sectionHandle === 'workshopOrEventSeries'
//           ? 'View series'
//           : `View ${obj.sectionHandle}`,
//     }
//   })
// })
// const bannerFeaturedCollection = computed(() => {
//   const bannerFeaturedCollection = page.value.featuredCollections[0]
//   return {
//     ...bannerFeaturedCollection,
//     to: `/${bannerFeaturedCollection.uri}`,
//     image: _get(
//       bannerFeaturedCollection,
//       'heroImage[0].image[0]',
//       null
//     ),
//     category: bannerFeaturedCollection.category
//       ? bannerFeaturedCollection.category.toString()
//       : '',
//     description: _get(bannerFeaturedCollection, 'text', ''),
//     prompt: `View ${bannerFeaturedCollection.sectionHandle}`,
//   }
// })
// const parsedSectionHighlightCollection = computed(() => {
//   const highlightCollections = page.value.featuredCollections.slice(1)
//   return highlightCollections.map((obj) => {
//     return {
//       ...obj,
//       to: `/${obj.uri}`,
//       image: _get(obj, 'heroImage[0].image[0]', ''),
//       category: obj.category ? obj.category.toString() : '',
//     }
//   })
// })

// function parseArticleCategory(categories) {
//   if (!categories || categories.length === 0)
//     return ''
//   let result = ''
//   categories.forEach((obj) => {
//     result = `${result + obj.title}, `
//   })
//   return result.slice(0, -2)
// }
// const bannerFeaturedNews = computed(() => {
//   const bannerFeaturedNews = page.value.featuredNews[0]
//   return {
//     ...bannerFeaturedNews,
//     to:
//       bannerFeaturedNews.externalResourceUrl != null
//         ? _get(bannerFeaturedNews, 'externalResourceUrl', '')
//         : `/${bannerFeaturedNews.to}`,
//     image: _get(bannerFeaturedNews, 'heroImage[0].image[0]', null),
//     // startDate: _get(bannerFeaturedNews, "postDate", null),
//     category: parseArticleCategory(
//       bannerFeaturedNews.articleCategories
//     ),
//     description: _get(bannerFeaturedNews, 'text', ''),
//     startDate: _get(bannerFeaturedNews, 'postDate', ''),
//     endDate: _get(bannerFeaturedNews, 'postDate', ''),
//     prompt: `View ${bannerFeaturedNews.sectionHandle}`,
//   }
// })
// const parsedNewsList = computed(() => {
//   const newsList = page.value.featuredNews.slice(1)
//   return newsList.map((obj) => {
//     return {
//       ...obj,
//       to:
//         obj.externalResourceUrl != null
//           ? _get(obj, 'externalResourceUrl', '')
//           : `/${obj.to}`,
//       image: _get(obj, 'heroImage[0].image[0]', ''),
//       category: parseArticleCategory(obj.articleCategories),
//       startDate: _get(obj, 'postDate', ''),
//       endDate: _get(obj, 'postDate', ''),
//     }
//   })
// })

// useHead({
//   title: page.value?.title || '... loading',
//   meta: [
//     {
//       hid: 'description',
//       name: 'description',
//       content: 'The UCLA Library creates a vibrant nexus of ideas, collections, expertise, and spaces in which users illuminate solutions for local and global challenges. We constantly evolve to advance UCLA’s research, education, and public service mission by empowering and inspiring communities of scholars and learners to discover, access, create, share, and preserve knowledge.',
//     },
//   ],
// })

// Now Showing data
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
        class="now-showing-section"
        theme="paleblue"
      >
        <template #top-right>
          <nuxt-link
            v-if="page.ftvaFeaturedEventsSection[0]"
            to="/events"
          >
            {{ page.ftvaFeaturedEventsSection[0].seeAllText }} <span style="font-size:1.5em;"> &#8250;</span>
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
        class="visit-learn-section"
        theme="paleblue"
        section-title="
        Visit
        and
        Learn"
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
          {{ page.ftvaQuickLinks }}
        </div>
      </SectionWrapper>
      <SectionWrapper
        class="no-padding"
        theme="paleblue"
      >
        <DividerWayFinder />
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
    padding-top: 0px;
    padding-bottom: 0px;
  }
}

.one-column {
  width: 100%;
  max-width: var(--max-width);
  margin: 0 auto;

  :deep(.nav-breadcrumb) {
    padding: 0px;
  }
}

.now-showing-section {
  .now-showing-items {
    background-color: var(--pale-blue);
    padding-top: 0px;

    // START HomePage specific cardmeta styles
    :deep(li.block-highlight) {
      max-width: 340px;
      flex-direction: column-reverse;
      margin-top: 16px;
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

    @media #{$small} {
      padding-top: 16px;
    }
  }
}

.visit-learn-section {
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
</style>
