<script setup>
// COMPONENT RE-IMPORTS
// TODO: remove when we have implemented component library as a module
// https://nuxt.com/docs/guide/directory-structure/components#library-authors
import { BlockCallToAction, CardMeta, DividerWayFinder, NavBreadcrumb, ResponsiveImage, RichText, SectionTeaserCard, SectionWrapper, TwoColLayoutWStickySideBar, VideoEmbed } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionDetail from '../gql/queries/FTVACollectionDetail.gql'

// COMPOSABLE
import { useContentIndexer } from '~/composables/useContentIndexer'

// UTILS
import removeTags from '~/utils/removeTags'
import socialList from '~/utils/socialList'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`collections-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVACollectionDetail, { slug: route.params.slug })
  return data
})

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
    // Index the collection data using the composable during static build
    await indexContent(data.value.ftvaCollection, route.params.slug)
    // console.log('Collection indexed successfully during static build')
  } catch (error) {
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
  'icon-info': 'svg-call-to-action-ftva-info',
  'icon-external-link': 'svg-call-to-action-ftva-external-link-dark'
}

const parsedInfoBlock = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!page.value.infoBlock || page.value.infoBlock.length === 0) {
    return null
  }
  return page.value.infoBlock.map((item, index) => {
    const parsedIcon = parsedInfoBlockIconLookup[item?.icon] ? parsedInfoBlockIconLookup[item.icon] : parsedInfoBlockIconLookup['icon-info']
    return {
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
      // Remove image tags
      bylineOne: item.richText.replace(/<img.*?>/ig, ''),
      image: item.ftvaImage && item.ftvaImage.length > 0 ? item.ftvaImage[0] : null,
    }
  })
  return relatedCollections
})
// console.log('related: ', parsedRelatedCollections.value)

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

function stripImageTags(str) {

}

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
    class="page page-detail page-collection-detail"
  >
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
          category="Collection"
          :title="page?.title"
        >
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
        <DividerWayFinder v-if="parsedInfoBlock" />
        <div
          v-if="parsedInfoBlock"
          class="cta-block"
        >
          <BlockCallToAction
            v-for="(item) in parsedInfoBlock"
            :key="item.text.concat(10)"
            :svg-name="item.icon"
            :text="item.text"
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
      />
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
.page-collection-detail {
  position: relative;

  .full-width {
    width: 100%;
    background-color: var(--pale-blue);
    margin: 0 auto;

    .section-wrapper.theme-paleblue {
      background-color: var(--pale-blue);
    }
  }

  :deep(.primary-column) {
    .svg__icon-ftva-external-link-dark {
      top: 5px;
    }
  }

  .cta-block {
    :deep(.block-call-to-action) {
      &:not(:last-child) {
        margin-bottom: 16px;
      }
    }
  }

  .related-collections-card {
    :deep(.byline-group) {
      @include truncate(2);
    }
  }
}

@import 'assets/styles/slug-pages.scss';
</style>
