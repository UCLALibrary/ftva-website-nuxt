<script setup>
// HELPERS
import _get from 'lodash/get'
import removeTags from '~/utils/removeTags'
import parseFieldForBreadcrumbTitleOverride from '~/utils/parseBreadcrumbTitles'

// GQL
import FTVALARebellionFilmmakersDetail from '~/gql/queries/FTVALARebellionFilmmakersDetail.gql'

// COMPOSABLE
import { useContentIndexer } from '~/composables/useContentIndexer'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`filmmaker-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVALARebellionFilmmakersDetail, { slug: route.params.slug })
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.ftvaLARebellionIndividual) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

// This is creating an index of the content for ES search
if (data.value.ftvaLARebellionIndividual && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the event data using the composable during static build
    data.value.ftvaLARebellionIndividual.titleSort = normalizeTitleForAlphabeticalBrowseBy(data.value.ftvaLARebellionIndividual.title)
    data.value.ftvaLARebellionIndividual.groupName = 'Collections'
    await indexContent(data.value.ftvaLARebellionIndividual, route.params.slug)
    // console.log('Event indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX EVENT during static build:', error)
  }
}

const page = ref(_get(data.value, 'ftvaLARebellionIndividual', {}))
watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'ftvaLARebellionIndividual', {})
})

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

const parsedAssociatedFilms = computed(() => {
  if (page.value.associatedFilms.length === 0) return []
  return page.value.associatedFilms.map((obj) => {
    // console.log('obj link', obj.filmLink)
    const newFilmLink = ['/', obj.filmLink?.[0]?.uri].join('')
    // console.log('newFilmLink', newFilmLink)
    // console.log('new obj', {
    //   ...obj,
    //   filmLink: [
    //     {
    //       ...obj.filmLink[0],
    //       uri: newFilmLink
    //     }
    //   ]
    // })
    return {
      ...obj,
      filmLink: [
        {
          ...obj.filmLink?.[0],
          uri: newFilmLink
        }
      ]
    }
  })
})

useHead({
  title: page.value ? page.value.title : '... loading',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: removeTags(page.value.richText)
    }
  ]
})

// BREADCRUMB OVERRIDES
// Add value of new breadcrumb title to switch statement in the utility file
const breadcrumbOverrides = ref([
  {
    titleLevel: 2,
    updatedTitle: parseFieldForBreadcrumbTitleOverride(page?.value.sectionHandle) || null
  }
])

const pageClasses = computed(() => {
  return ['page', 'page-detail', 'page-detail--paleblue', 'page-filmmaker-detail']
})
</script>

<template>
  <main
    id="main"
    :class="pageClasses"
  >
    <div class="one-column">
      <NavBreadcrumb
        class="breadcrumb"
        data-test="breadcrumb"
        :title="page?.title"
        :override-title-group="breadcrumbOverrides"
      />

      <ResponsiveImage
        v-if="parsedImage && parsedImage.length === 1 && parsedImage[0]?.image && parsedImage[0]?.image?.length === 1"
        data-test="single-image"
        :media="parsedImage[0]?.image[0]"
        :aspect-ratio="43.103"
        class="resized-aspect-ratio"
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
          class="resized-aspect-ratio"
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

    <TwoColLayoutWStickySideBar
      data-test="second-column"
      class="two-column"
    >
      <template #primaryTop>
        <CardMeta
          data-test="text-block"
          category="L.A. Rebellion"
        >
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
        <RichText :rich-text-content="page?.richText" />
      </template>
    </TwoColLayoutWStickySideBar>

    <SectionWrapper
      v-if="parsedAssociatedFilms && parsedAssociatedFilms.length > 0"
      section-title="Filmography"
      theme="paleblue"
      class="filmography-section-wrapper"
    >
      <TableComponent
        :table-headers="['', 'Title', 'Role', 'Year']"
        :table-caption="'Filmography'"
      >
        <TableRow
          v-for="item, index in parsedAssociatedFilms"
          :key="index"
          :num-cells="4"
        >
          <template #column1>
            <div class="responsive-image">
              <ResponsiveImage :media="item.image[0]" />
            </div>
          </template>
          <template #column2>
            <h1>
              <SmartLink
                class="film-title"
                :to="item.filmLink[0].uri"
              >
                {{ item.titleGeneral }}
              </SmartLink>
            </h1>
            <RichText :rich-text-content="item.description" />
          </template>
          <template #column3>
            <p class="subtitle">
              {{ item.roles }}
            </p>
          </template>
          <template #column4>
            <p class="subtitle">
              {{ item.year }}
            </p>
          </template>
        </TableRow>
      </TableComponent>
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/slug-pages.scss';

.page-filmmaker-detail {
  position: relative;

  .two-column {
    :deep(.primary-section-wrapper) {
      margin-bottom: 0;

      .parsed-content {
        margin-bottom: 0
      }
    }

    // Disable unused elements that are added superfluous spacing
    :deep(.sidebar-column),
    :deep(.sidebar-mobile-top),
    :deep(.sidebar-mobile-bottom) {
      display: none;
    }

    .ftva.button-dropdown {
      margin-top: 30px;
    }

    .ftva.block-info {
      margin-top: 48px;
    }

    // when two-column div is not followed by a filmography section
    &:last-child {
      padding-bottom: 120px; // Page bottom spacing
    }

    // fix button scrolling over header
    :deep(.sharebutton-slot) {
      position: relative;
      z-index: 1;
    }
  }

  .filmography-section-wrapper {
    margin-top: 64px;
    padding-bottom: 80px; // Page bottom spacing: 120px (80px + table's padding)

    .ftva.table-wrapper {
      background: white;
      padding: 36px 40px 52px;

      :deep(.ftva.table-component) {
        max-width: 100%;
      }

      @media (max-width: 899px) {
        padding: 12px;
      }
    }
  }

  // change filmography section title color
  :deep(.section-header) {

    // reduce space below title by 12px on desktop (was 40px)
    @media #{$large} {
      margin-bottom: 28px;
    }

    .section-title {
      color: #2f2f2f;
    }

    font-weight: 800;
  }

  @media #{$small} {
    .two-column {
      &:last-child {
        padding-bottom: 86px; // Page bottom spacing
      }
    }

    .filmography-section-wrapper {
      padding-bottom: 86px;
    }
  }
}
</style>
