<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionList from '../gql/queries/FTVACollectionList.gql'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('collection-list', async () => {
  const data = await $graphql.default.request(FTVACollectionList)
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

// METADATA INFO
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    const doc = {
      title: data.value.entry.title,
      text: data.value.entry.summary,
      uri: '/collections',
      sectionHandle: data.value.entry.sectionHandle,
      groupName: 'Collections',
    }
    // Index the articles data using the composable during static build
    await indexContent(doc, 'explore-collections')
    // console.log('Explore Collections content indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO EXPLORE COLLECTIONS LISTING during static build:', error)
  }
}

// DATA
const page = ref(_get(data.value, 'entry', {}))

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
})

const parsedHeroImage = computed(() => {
  return page.value.heroImage[0].image
})

const showPageSummary = computed(() => {
  return page.value?.summary && page.value?.displaySummary === 'yes'
})

const parsedCollections = computed(() => {
  return page.value.collections.map((collection) => {
    // Parse collection items images and uris
    const parsedSelectedCollectionItems = collection.featuredCollections.map((item) => {
      return {
        ...item,
        to: item.uri,
        image: item.imageCarousel[0]?.image[0]
      }
    })

    return {
      ...collection,
      featuredCollections: parsedSelectedCollectionItems
    }
  })
})

const parsedResources = computed(() => {
  if (page.value.otherResources.length === 0) return null

  return page.value.otherResources[0].featuredResources.map((obj) => {
    return {
      title: obj.title,
      to: `/${obj.uri}`,
      image: obj.image[0]
    }
  })
})

const parsedAboutCollections = computed(() => {
  if (page.value.aboutOurCollections.length === 0) return null

  return page.value.aboutOurCollections[0].collectionsInformation.map((obj) => {
    return {
      title: obj.title,
      to: `/${obj.uri}`,
      image: obj.image[0]
    }
  })
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
    class="page page-detail page-explore-collections"
  >
    <div class="one-column">
      <ResponsiveImage
        v-if="parsedHeroImage.length === 1"
        :media="parsedHeroImage[0]"
        :aspect-ratio="43.103"
        data-test="hero-image"
      />
      <SectionWrapper
        :section-title="page.title"
        class="header"
        theme="paleblue"
        data-test="page-heading"
      >
        <template v-if="showPageSummary">
          <RichText
            :rich-text-content="page.summary"
            data-test="page-description"
          />
        </template>
      </SectionWrapper>
    </div>

    <SectionWrapper
      class="section-wrapper-header-divider"
      theme="paleblue"
    >
      <DividerWayFinder />
    </SectionWrapper>

    <SectionWrapper
      v-for="collection of parsedCollections"
      :key="collection.sectionTitle"
      :section-title="collection.sectionTitle"
      :section-summary="collection.sectionDescription"
      class="section-wrapper-featured-collections"
      theme="paleblue"
      data-test="featured-collection"
    >
      <template #top-right>
        <nuxt-link :to="collection.uri">
          View All <span style="font-size:1.5em;"> &#8250;</span>
        </nuxt-link>
      </template>

      <ScrollWrapper>
        <SectionTeaserCard
          :items="collection.featuredCollections"
          :grid-layout="false"
        />
      </ScrollWrapper>
      <DividerWayFinder />
    </SectionWrapper>

    <SectionWrapper
      :section-title="page.hearstTitle"
      theme="paleblue"
      class="section-wrapper-hearst"
      data-test="hearst-collection"
    >
      <BlockCardWithImage
        :image="page.hearstImage[0]"
        :to="page.hearstUri"
      >
        <template #customDescription>
          <RichText :rich-text-content="page.hearstDescription" />
        </template>
      </BlockCardWithImage>
      <DividerWayFinder />
    </SectionWrapper>

    <SectionWrapper
      v-if="parsedResources"
      :section-title="page.otherResources[0].sectionTitle"
      :section-summary="page.otherResources[0].sectionDescription"
      theme="paleblue"
      class="section-wrapper-post-small"
    >
      <SectionPostSmall
        :items="parsedResources"
        data-test="other-resources"
      />
      <DividerWayFinder />
    </SectionWrapper>

    <SectionWrapper
      v-if="parsedAboutCollections"
      :section-title="page.aboutOurCollections[0].sectionTitle"
      :section-summary="page.aboutOurCollections[0].sectionDescription"
      theme="paleblue"
      class="section-wrapper-post-small"
    >
      <SectionPostSmall
        :items="parsedAboutCollections"
        data-test="about-collections"
      />
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/listing-pages.scss';

.page-explore-collections {
  position: relative;
  background-color: var(--pale-blue);

  .one-column {
    padding-top: 80px;
  }

  .header {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-content: center;
    align-items: center;
  }

  .header :deep(.section-title) {
    color: $heading-grey;
    margin-bottom: 0;
  }

  .header :deep(p) {
    @include ftva-body-2;
  }

  .section-wrapper-header-divider,
  .section-wrapper-featured-collections,
  .section-wrapper-hearst,
  :deep(.section-wrapper-post-small) {
    padding-top: 0;
  }

  .section-wrapper-header-divider .divider-way-finder {
    margin-block-start: 0;
  }

  .divider-way-finder {
    margin-block-end: 0;
  }

  :deep(.rich-text.section-summary) {
    @include ftva-body-2;
  }

  .section-wrapper-featured-collections {
    :deep(.section-header) {
      margin-bottom: 20px;
    }

    :deep(.section-title) {
      color: $heading-grey;
    }

    :deep(.rich-text.section-summary) {
      max-width: 100%;
    }

    .section-teaser-card {
      background-color: var(--pale-blue);

      :deep(.card) {
        width: 320px;
      }
    }
  }

  .section-wrapper-hearst {
    :deep(.section-title) {
      color: $heading-grey;
    }

    .block-highlight {
      background-color: #fff;
      padding-bottom: 0;

      :deep(.image-container),
      :deep(.image) {
        max-height: 400px;
      }

      :deep(.card-meta) {
        min-height: max-content;
        padding: 40px;

        .title {
          margin-bottom: 0;
        }
      }

      .rich-text {
        padding: 0;
        margin-bottom: 0;

        :deep(.parsed-content) {
          margin-bottom: 0;
        }
      }
    }
  }

  :deep(.section-wrapper-post-small) {
    .section-title {
      color: $heading-grey;
    }

    .rich-text {
      max-width: 100%;
    }

    &:last-of-type {
      margin-bottom: 60px;
    }
  }

  @media #{$medium} {
    .one-column {
      padding-top: 60px;
    }
  }

  @media #{$small} {
    :deep(.section-wrapper:not(:first-of-type)) {
      .section-header.section-title {
        @include ftva-h5;
        font-size: 28px;
      }
    }

    .section-wrapper-featured-collections {
      :deep(.section-header) {
        display: flex;
        flex-direction: column;
        row-gap: 8px;
      }

      :deep(.section-link) {
        position: static;
        margin-top: 0;
        margin-bottom: 24px;
        order: 1;
      }
    }

    .section-wrapper-hearst {
      .block-highlight {
        :deep(.card-meta) {
          min-height: max-content;
          padding: 25px;
        }
      }
    }
  }
}
</style>
