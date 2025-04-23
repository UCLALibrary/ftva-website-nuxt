<script setup>

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionTypeListing from '../gql/queries/FTVACollectionTypeListing.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

// routes this page supports:
const routeNameToSectionMap = {
  '/collections/motion-picture': {
    sectionName: 'ftvaListingMotionPictureCollections',
    collection: 'motionPicture'
  },
  '/collections/television': {
    sectionName: 'ftvaListingTelevisionCollections',
    collection: 'television'
  },
  '/collections/watch-listen-online': {
    sectionName: 'ftvaListingWatchAndListenOnline',
    collection: 'watchAndListenOnline'
  }
}

const { data, error } = await useAsyncData(route.path, async () => {
  // lookup section based on routeNameToSectionMap
  const data = await $graphql.default.request(FTVACollectionTypeListing, { section: routeNameToSectionMap[route.path].sectionName })
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entry) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

// DATA
const page = ref(_get(data.value, 'entry', {}))
console.log('Page data: ', page.value)
const pageTitle = page.value.title
const pageSummary = page.value.summary
const generalContentPages = page.value.associatedGeneralContentPagesFtva

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
  pageTitle.value = page.value.title
  pageSummary.value = page.value.summary
  generalContentPages.value = page.value.associatedGeneralContentPagesFtva
})

// TESTING ES
const collectionType = ref(routeNameToSectionMap[route.path].collection)
const collectionList = ref([])
const currentPage = ref(1)
const documentsPerPage = 12
const totalDocuments = ref()
const extraFilters = ref('*')
const alphabet = ref()

onMounted(() => {
  testES()
})

async function testES() {
  const { paginatedCollectionListQuery } = useCollectionListSearch()
  const esOutput = await paginatedCollectionListQuery(
    collectionType.value,
    currentPage.value,
    documentsPerPage,
    extraFilters.value
  )

  console.log('Browse-by: ', extraFilters.value)
  collectionList.value = esOutput.hits.hits
  console.log('Collection List: ', collectionList.value)
  totalDocuments.value = esOutput.hits.total.value
}

watch(alphabet, (newVal, oldVal) => {
  extraFilters.value = `${newVal.toUpperCase()}*`
  testES()
})

const parsedCollectionList = computed(() => {
  if (collectionList.value.length === 0) return []

  return collectionList.value.map((obj) => {
    return {
      ...obj.source,
      to: `/${obj._source.uri}`,
      title: obj._source.title,
      text: obj._source.richText.replace(/<img.*?>/ig, ''),
      ftvaCollectionType: obj._source.ftvaCollectionType,
      image: parseImage(obj)
    }
  })
})

definePageMeta({
  layout: 'default',
  path: '/collections/motion-picture',
  alias: ['/collections/television', '/collections/watch-listen-online']
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
    class="page page-collection-type"
  >
    <SectionWrapper theme="paleblue">
      <NavBreadcrumb
        data-test="breadcrumb"
        :title="pageTitle"
      />
    </SectionWrapper>

    <SectionWrapper
      section-title="pageTitle"
      class="header"
      theme="paleblue"
      data-test="page-title"
    >
      <RichText :rich-text-content="pageSummary" />
    </SectionWrapper>

    <SectionWrapper theme="paleblue">
      <DividerWayFinder />

      <p class="search-heading">
        Browse by Alphabetical Order
      </p>
      <AlphabeticalBrowseBy
        class="browse-margin"
        :selected-letter-prop="selectedLetterProp"
        @selected-letter="searchBySelectedLetter"
      />

      <div class="collection-type-list-wrapper">
        <SectionTeaserCard :items="parsedCollectionList" />

        <SectionPagination
          v-if="totalPages !== 1 && !isMobile"
          :pages="totalPages"
          :initial-current-page="currentPage"
        />
      </div>

      <DividerWayFinder />
    </SectionWrapper>

    <SectionWrapper
      class=""
      theme="paleblue"
      :level="3"
    >
      <SectionHeader :level="3">
        About Our Collections
      </SectionHeader>

      <!-- Rich Text -->

      <!-- Post Cards -->
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
.page-collection-type {

  position: relative;
  background-color: var(--pale-blue);

  .header {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-content: center;
    align-items: center;
    text-align: center;
    max-width: 787px;
  }

  :deep(.block-highlight) {
    border-radius: 0;

    .media,
    &.is-vertical .image-container .molecule-no-image {
      border-radius: 0;
    }

    &.is-vertical.card:hover {
      box-shadow: none;
    }

    .card-meta.card-meta-items:hover>a.title {
      text-decoration: underline;
      text-decoration-color: #2C91FF;
      text-decoration-thickness: 3px;
      text-underline-offset: 3px;
    }
  }

  :deep(.card-meta) {
    background-color: var(--pale-blue);
  }

  // @media(min-width: 991px) {
  //   .ftva.block-highlight.is-vertical.card {
  //     height: 550px;
  //   }
  // }

}
</style>
