<script lang="ts" setup>
// COMPONENT RE-IMPORTS
// TODO: remove when we have implemented component library as a module
// https://nuxt.com/docs/guide/directory-structure/components#library-authors
import { BlockCallToAction, CardMeta, DividerWayFinder, NavBreadcrumb, ResponsiveImage, RichText, SectionTeaserCard, SectionWrapper, TwoColLayoutWStickySideBar, VideoEmbed } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionDetail from '../gql/queries/FTVACollectionDetail.gql'
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

const page = ref(_get(data.value, 'ftvaCollection', {}))

watch(data, (newVal, oldVal) => {
  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
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
const parsedCollectionType = computed(() => {
  if (page.value.ftvaCollectionType) {
    // split camelCase items in list and join with space, then join list with comma
    return page.value.ftvaCollectionType.map(str => str.split(/(?=[A-Z])/).join(' ')).join(', ')
  }
  return null
})
// Map icon names to svg names for infoBlock
const parsedInfoBlockIconLookup = {
  'icon-download': 'svg-call-to-action-ftva-pdf',
  'icon-external-link': 'svg-call-to-action-ftva-info'
}
const parsedInfoBlock = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!page.value.infoBlock) {
    return null
  }
  return page.value.infoBlock.map((item, index) => {
    const parsedIcon = parsedInfoBlockIconLookup[item?.icon] ? parsedInfoBlockIconLookup[item.icon] : parsedInfoBlockIconLookup['icon-external-link']
    return {
      text: item.text,
      icon: parsedIcon
    }
  })
})
const parsedRelatedCollections = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!page.value.ftvaRelatedCollections) {
    return []
  }

  const relatedCollections = page.value.ftvaRelatedCollections.map((item, index) => {
    return {
      ...item,
      to: `/${item.uri}`, // remove 'collection/' from uri
      category: 'collection',
      image: item.ftvaImage && item.ftvaImage.length > 0 ? item.ftvaImage[0] : null,
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
  title: page.value?.title || '... loading',
})
</script>
<template>
  <main
    id="main"
    class="page page-collection-detail"
  >
    <div class="one-column">
      <NavBreadcrumb
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
          :category="parsedCollectionType"
          :title="page?.title"
        >
          <template #sharebutton>
            <ButtonDropdown
              button-title="Share"
              :has-icon="true"
              :dropdown-list="socialList.dropdownList"
            />
          </template>
        </CardMeta>
      </template>

      <!-- Sidebar -->
      <!-- may need to move to diff slot? -->
      <template #sidebarTop>
        <BlockCallToAction
          :use-global-data="true"
          :is-centered="false"
        />
      </template>
      <template #primaryMid>
        <RichText
          v-if="page?.richText"
          :rich-text-content="page?.richText"
        />
        <!-- todo poster image support check craft CMS test data -->
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
    <!-- <div> {{ page }}</div> -->
    <SectionWrapper
      v-if="parsedRelatedCollections && parsedRelatedCollections.length > 0"
      theme="paleblue"
      :section-title="page.sectionTitle"
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
        class="other-series-section"
        :items="parsedRelatedCollections"
      />
    </SectionWrapper>
  </main>
</template>
<style lang="scss" scoped>
.page-collection-detail {
  position: relative;

  // TODO move this element to global mixin or something, its on every detail page
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

  // TODO global?
  .one-column {
    width: 100%;
    max-width: var(--max-width);
    margin: 0 auto;

    :deep(.nav-breadcrumb) {
      padding: 0px;
    }
  }

  // TODO global?
  .full-width {
    width: 100%;
    background-color: var(--pale-blue);
    margin: 0 auto;

    .section-wrapper.theme-paleblue {
      background-color: var(--pale-blue);
    }
  }
}
</style>
