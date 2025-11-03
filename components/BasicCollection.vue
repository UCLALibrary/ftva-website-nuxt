<script lang="ts" setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionDetail from '../gql/queries/FTVACollectionDetail.gql'

// COMPOSABLE
import { useContentIndexer } from '~/composables/useContentIndexer'

// UTILS
import removeTags from '~/utils/removeTags'
import { socialList } from '~/utils/socialList'
import normalizeTitleForAlphabeticalBrowse from '~/utils/normalizeTitleForAlphabeticalBrowseBy'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`collections-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVACollectionDetail, { slug: route.params.slug })
  return data
}) as { data: Ref<{ ftvaCollection: any } | null>, error: Ref<any> }

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.ftvaCollection) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

// This is creating an index of the main content (not related content)
if (data.value.ftvaCollection && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    data.value.ftvaCollection.titleSort = normalizeTitleForAlphabeticalBrowse(data.value.ftvaCollection.title)
    data.value.ftvaCollection.titleBrowse = normalizeTitleForAlphabeticalBrowse(data.value.ftvaCollection.title)
    data.value.ftvaCollection.groupName = 'Collections'

    // Index the collection data using the composable during static build
    await indexContent(data.value.ftvaCollection, route.params.slug)
    // console.log('Collection indexed successfully during static build', data.value.ftvaCollection)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX COLLECTION during static build:', error)
  }
}

const page = ref(_get(data.value, 'ftvaCollection', {}))

watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'ftvaCollection', {})
})

// DATA PARSING
const parsedImage = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!page.value.imageCarousel) {
    return []
  }
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

// Map icon names to svg names for infoBlock
const parsedInfoBlockIconLookup = {
  'icon-download': 'svg-call-to-action-ftva-pdf',
  'icon-ftva-download': 'svg-call-to-action-ftva-pdf',
  'icon-info': 'svg-call-to-action-ftva-info',
  'icon-ftva-info': 'svg-call-to-action-ftva-info',
  'icon-external-link': 'svg-call-to-action-ftva-external-link-dark',
  'icon-ftva-external-link': 'svg-call-to-action-ftva-external-link-dark'
}

const parsedInfoBlock = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!page.value.infoBlock || page.value.infoBlock.length === 0) {
    return null
  }
  return page.value.infoBlock.map((item, index) => {
    const parsedIcon = parsedInfoBlockIconLookup[item?.icon] ? parsedInfoBlockIconLookup[item.icon] : parsedInfoBlockIconLookup['icon-info']
    return {
      ...item,
      text: item.text,
      icon: parsedIcon
    }
  })
})

const parsedRelatedCollectionsHeader = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!page.value.sectionTitle) {
    return 'Related Collections'
  }
  return page.value.sectionTitle ? page.value.sectionTitle : 'Related Collections'
})

const parsedRelatedCollections = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!page.value.ftvaRelatedCollections) {
    return []
  }

  const relatedCollections = page.value.ftvaRelatedCollections.map((item, index) => {
    return {
      ...item,
      to: `/${item.uri}`,
      category: 'collection',
      // Remove image tags inside byline rich text
      bylineOne: item.richText.replace(/<img.*?>/ig, ''),
      image: parseImage(item)
    }
  })
  return relatedCollections
})

const parsedRelatedCollectionsText = computed(() => {
  // TODO does this fail gracefully?
  const text = _get(page.value, 'viewAllSectionLink[0].viewAllText', '')
  return text || 'View All'
})

// TODO goes to /collections/[uri] - is this correct check with UX?
const parsedRelatedCollectionsLink = computed(() => {
  // TODO does this fail gracefully?
  const link = _get(page.value, 'viewAllSectionLink[0].viewAllLink[0].uri', '')
  return link || '/collections'
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

const pageClasses = computed(() => {
  return ['page', 'page-detail', 'page-detail--paleblue', 'page-collection-detail']
})
</script>

<template>
  <div :class="pageClasses">
    <div class="one-column">
      <NavBreadcrumb
        data-test="breadcrumb"
        class="breadcrumb"
        :title="page?.title"
        to="/collections"
      />

      <ResponsiveImage
        v-if="parsedImage.length === 1"
        :media="parsedImage[0].image[0]"
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
        <CardMeta category="Collection">
          <template #anyTitle>
            <h1 class="title-no-link">
              {{ page?.title }}
            </h1>
          </template>
          <template #sharebutton>
            <ButtonDropdown
              data-test="share-button"
              button-title="Share"
              :has-icon="true"
              :dropdown-list="socialList.dropdownList"
            />
          </template>
        </CardMeta>
      </template>

      <!-- Sidebar -->
      <template #sidebarTop>
        <BlockCallToAction
          data-test="sidebar-cta"
          :use-global-data="true"
          :is-centered="false"
        />
      </template>
      <template #primaryMid>
        <RichText
          v-if="page?.richText"
          :rich-text-content="page?.richText"
        />
        <DividerWayFinder v-if="page.videoEmbed" />
        <VideoEmbed
          v-if="page.videoEmbed"
          :trailer="page.videoEmbed"
        />
        <!-- TODO APPS-3326 can remove the '&& parsedInfoBlock.text' condition when we have a way to support Contact Info Data in this spot -->
        <DividerWayFinder v-if="parsedInfoBlock && parsedInfoBlock[0]?.text" />
        <div
          v-if="parsedInfoBlock && parsedInfoBlock[0]?.text"
          class="cta-block"
        >
          <BlockCallToAction
            v-for="(item) in parsedInfoBlock"
            :key="item.text.concat(10)"
            :svg-name="item.icon"
            :text="item.text"
            :title="item.heading ? item.heading : ''"
            :is-centered="false"
          />
        </div>
      </template>
    </TwoColLayoutWStickySideBar>
    <SectionWrapper
      v-if="parsedRelatedCollections && parsedRelatedCollections.length > 0"
      theme="paleblue"
      :section-title="parsedRelatedCollectionsHeader"
      class="series-section-wrapper"
    >
      <template #top-right>
        <nuxt-link
          v-if="parsedRelatedCollectionsLink"
          :to="parsedRelatedCollectionsLink"
        >
          {{ parsedRelatedCollectionsText }} <span style="font-size:1.5em;"> &#8250;</span>
        </nuxt-link>
      </template>
      <SectionTeaserCard
        class="related-collections-card"
        :items="parsedRelatedCollections"
        :grid-layout="false"
      />
    </SectionWrapper>
  </div>
</template>

<style lang="scss" scoped>
@import 'assets/styles/slug-pages.scss';

.page-collection-detail {
  position: relative;

  .two-column {
    margin-bottom: 120px; // Spacing between main content and footer; without a "Related / More" section
  }

  .two-column:has(+ .series-section-wrapper) {
    margin-bottom: 60px; // Spacing between main content and "Related / More" section
  }

  :deep(.primary-column) {
    .svg__icon-ftva-external-link-dark {
      top: 5px;
    }

    .section-wrapper,
    .parsed-content {
      margin-bottom: 0;
    }
  }

  :deep(.sidebar-column) {
    padding-bottom: 0;
  }

  .cta-block {
    :deep(.block-call-to-action) {
      &:not(:last-child) {
        margin-bottom: 16px;
      }
    }
  }

  .related-collections-card {
    :deep(.card-meta) {
      display: grid;
      grid-template-rows: auto 1fr 1fr;
      row-gap: 8px;

      .category,
      .title,
      .byline-group {
        margin: 0;
      }

      .title {
        @include truncate(2);
      }

      .byline-group {
        position: static;
      }
    }

    :deep(.byline-group) {
      @include truncate(2);
    }

  }

  @media #{$small} {
    .two-column {
      margin-bottom: 86px;
    }

    .two-column:has(+ .series-section-wrapper) {
      margin-bottom: 30px;
    }
  }
}
</style>
