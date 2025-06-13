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
// TODO This is creating an index of the content for ES search

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
console.log('page data: ', page.value)

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
  return page.value.collections.map((item) => {
    const test = item.featuredCollections.map((inner) => {
      console.log('carousel: ', inner.imageCarousel[0]?.image[0])
      return {
        ...inner,
        to: inner.uri,
        image: inner.imageCarousel[0]?.image[0]
      }
    })

    return {
      ...item,
      featuredCollections: test
    }
  })
})

// console.log('collections: ', parsedCollections.value)

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
      >
        <template v-if="showPageSummary">
          <RichText :rich-text-content="page.summary" />
        </template>
      </SectionWrapper>
    </div>

    <SectionWrapper
      class="dividers"
      theme="paleblue"
    >
      <DividerWayFinder />
    </SectionWrapper>

    <SectionWrapper
      v-for="collection of parsedCollections"
      :key="collection.sectionTitle"
      :section-title="collection.sectionTitle"
      :section-summary="collection.sectionDescription"
      class="featured-collections"
      theme="paleblue"
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
    <!--  -->
    <!--  -->
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
    text-align: center;
  }

  .header>:deep(.section-header) {
    margin-top: 20px;
    margin-bottom: 0px;

    h2.section-title {
      color: $heading-grey;
    }
  }

  .dividers {
    // padding-block: 0;
    padding-top: 0;

    .divider-way-finder {
      margin-block: 0;
    }
  }

  .section-wrapper.featured-collections {
    padding-top: 0;

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

    .divider-way-finder {
      margin-bottom: 0;
    }
  }

  @media #{$medium} {
    .one-column {
      padding-top: 60px;
    }
  }

  @media #{$small} {
    .featured-collections {
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
  }
}
</style>
