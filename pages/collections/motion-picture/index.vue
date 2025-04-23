<script setup>

// HELPERS
import _get from 'lodash/get'
import { useWindowSize, useInfiniteScroll } from '@vueuse/core'

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

// "STATE"
const desktopPage = useState('desktopPage', () => 1) // Persist desktop page
const collectionType = ref(routeNameToSectionMap[route.path].collection)
const desktopList = ref([])
const mobileList = ref([])

// const collectionList = ref([])
const collectionList = computed(() => (isMobile.value ? mobileList.value : desktopList.value))

const currentPage = ref(1)
const documentsPerPage = 12
const totalDocuments = ref()
const totalPages = ref(0)
const extraFilters = ref('*')

const alphabet = ref()

// INFINITE SCROLLING
const isLoading = ref(false)
const isMobile = ref(false)
const hasMore = ref(true) // Flag to control infinite scroll

const scrollElem = ref(null)
const { reset } = useInfiniteScroll(
  scrollElem,
  async () => {
    if (isMobile.value && hasMore.value && !isLoading.value) {
      currentPage.value++
      await searchES()
    }
  },
  { distance: 100 }
)

// HANDLE WINDOW SIZING
const { width } = useWindowSize()
watch(width, (newWidth) => {
  const wasMobile = isMobile.value

  isMobile.value = newWidth <= 750
  // Reinitialize only when transitioning between mobile and desktop
  if (wasMobile !== isMobile.value) {
    handleScreenTransition()
  }
}, { immediate: true })

// HANDLE SCREEN TRANSITIONS
function handleScreenTransition() {
  if (isMobile.value) {
    // Switching to mobile: save desktop page, clear query param

    desktopPage.value = currentPage.value
    currentPage.value = 1
    mobileList.value = []
    hasMore.value = true
    const { page, ...remainingQuery } = route.query
    useRouter().push({ query: { ...remainingQuery } })
  } else {
    // Switching to desktop: restore query param
    if (totalPages.value === 1)
      desktopPage.value = 1
    const restoredPage = desktopPage.value || 1
    useRouter().push({ query: { ...route.query, page: restoredPage.toString() } })
    currentPage.value = restoredPage
    desktopList.value = []
  }
  searchES()
}

// onMounted(() => {
//   testES()
// })

async function searchES() {
  if (isLoading.value || !hasMore.value) return

  isLoading.value = true

  const { paginatedCollectionListQuery } = useCollectionListSearch()

  try {
    const results = await paginatedCollectionListQuery(
      collectionType.value,
      currentPage.value,
      documentsPerPage,
      extraFilters.value
    )

    console.log('ES results: ', results)

    if (results && results.hits && results?.hits?.hits?.length > 0) {
      const newList = results.hits.hits || []

      if (isMobile.value) {
        totalPages.value = 0

        mobileList.value.push(...newList)

        hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
      } else {
        desktopList.value = newList

        totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)
      }
    } else {
      totalPages.value = 0

      hasMore.value = false
    }
  }
  catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching data:', error)
    hasMore.value = false
  } finally {
    isLoading.value = false
  }
}

// console.log('Browse-by: ', extraFilters.value)
// collectionList.value = esOutput.hits.hits
// console.log('Collection List: ', collectionList.value)
// totalDocuments.value = esOutput.hits.total.value
// }

// async function testES() {
//   const { paginatedCollectionListQuery } = useCollectionListSearch()
//   const esOutput = await paginatedCollectionListQuery(
//     collectionType.value,
//     currentPage.value,
//     documentsPerPage,
//     extraFilters.value
//   )

//   console.log('Browse-by: ', extraFilters.value)
//   collectionList.value = esOutput.hits.hits
//   console.log('Collection List: ', collectionList.value)
//   totalDocuments.value = esOutput.hits.total.value
// }

// watch(alphabet, (newVal, oldVal) => {
//   extraFilters.value = `${newVal.toUpperCase()}*`
//   testES()
// })

watch(
  () => route.query,
  (newVal, oldVal) => {
    isLoading.value = false
    currentPage.value = route.query.page ? parseInt(route.query.page) : 1
    isMobile.value ? mobileList.value = [] : desktopList.value = []
    hasMore.value = true
    searchES()
  }, { deep: true, immediate: true }
)

const parsedCollectionList = computed(() => {
  if (collectionList.value.length === 0) return []

  return collectionList.value.map((obj) => {
    return {
      ...obj.source,
      to: `/${obj._source.uri}`,
      title: obj._source.title,
      text: obj._source.richText?.replace(/<img.*?>/ig, ''),
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
      ref="scrollElem"
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
      <!-- <AlphabeticalBrowseBy
        class="browse-margin"
        :selected-letter-prop="selectedLetterProp"
        @selected-letter="searchBySelectedLetter"
      /> -->

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
