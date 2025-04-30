<script setup>

// HELPERS
import _get from 'lodash/get'
import { useWindowSize, useInfiniteScroll } from '@vueuse/core'

// GQL
import FTVACollectionTypeListing from '../gql/queries/FTVACollectionTypeListing.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

// routes this page template supports:
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
  const data = await $graphql.default.request(FTVACollectionTypeListing, { section: routeNameToSectionMap[route.path]?.sectionName })
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

// METADATA INFO
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    const doc = {
      title: data.value.entry.title,
      text: data.value.entry.summary,
      uri: route.path
    }
    // Index the collection type data using the composable during static build
    await indexContent(doc, 'collection-type-listing')
    // console.log('Collection type listing indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX COLLECTION TYPE LISTING during static build:', error)
  }
}

// DATA
const page = ref(_get(data.value, 'entry', {}))
const pageTitle = page.value.title
const pageSummary = page.value.summary
const generalContentPagesSection = page.value.sectionHeader[0]
const generalContentPages = page.value.associatedGeneralContentPagesFtva

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
  pageTitle.value = page.value.title
  pageSummary.value = page.value.summary
  generalContentPagesSection.value = page.value.sectionHeader[0]
  generalContentPages.value = page.value.associatedGeneralContentPagesFtva
})

// "STATE"
const desktopPage = useState('desktopPage', () => 1) // Persist desktop page

const desktopList = ref([])
const mobileList = ref([])
const collectionList = computed(() => (isMobile.value ? mobileList.value : desktopList.value))

const hits = ref(0)
const currentPage = ref(1)
const documentsPerPage = 12
const totalPages = ref(0)

const collectionType = ref(routeNameToSectionMap[route.path].collection)
const extraSearchFilter = ref('*')
const selectedLetterProp = ref('')

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

async function searchES() {
  if (isLoading.value || !hasMore.value) return

  isLoading.value = true

  const { paginatedCollectionListQuery } = useCollectionListSearch()

  try {
    const results = await paginatedCollectionListQuery(
      collectionType.value,
      currentPage.value,
      documentsPerPage,
      extraSearchFilter.value
    )

    if (results && results.hits && results?.hits?.hits?.length > 0) {
      const newCollectionList = results.hits.hits || []
      hits.value = results.hits.total.value

      if (extraSearchFilter.value.length === 2) {
        selectedLetterProp.value = extraSearchFilter.value.replace('*', '')
      } else {
        selectedLetterProp.value = 'All'
      }
      console.log('In ES call, ExtraSearchFilter: ', extraSearchFilter.value)
      console.log('In ES call, selectedLetterProp: ', selectedLetterProp.value)

      if (isMobile.value) {
        totalPages.value = 0

        mobileList.value.push(...newCollectionList)

        hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
      } else {
        desktopList.value = newCollectionList

        totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)
      }
    } else {
      totalPages.value = 0
      hits.value = 0
      hasMore.value = false
    }
  }
  catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching data:', error)
    hasMore.value = false
    hits.value = 0
  } finally {
    isLoading.value = false
  }
}

function browseBySelectedLetter(letter) {
  desktopList.value = []
  mobileList.value = []

  if (letter !== 'All') {
    extraSearchFilter.value = `${letter}*`
    selectedLetterProp.value = letter
  } else {
    extraSearchFilter.value = '*'
    selectedLetterProp.value = 'All'
  }

  useRouter().push({
    path: route.path,
    query: {
      filters: extraSearchFilter.value
    },
  })
}

watch(() => route.query,
  (newVal, oldVal) => {
    console.log('Watcher newVal, oldVal: ', newVal, oldVal)
    currentPage.value = route.query.page ? parseInt(route.query.page) : 1
    isMobile.value ? mobileList.value = [] : desktopList.value = []
    hasMore.value = true

    const filterLetter = route.query.filters
    console.log('In watcher, filterLetter/route.query.filters: ', route.query.filters)

    // filterLetter is general wildcard ('*') or lettered (ex: 'A*')
    if (filterLetter?.length === 2) {
      selectedLetterProp.value = filterLetter.replace('*', '')
      extraSearchFilter.value = filterLetter
    } else {
      selectedLetterProp.value = 'All'
      extraSearchFilter.value = '*'
    }
    console.log('In watcher, selectedLetterProp: ', selectedLetterProp.value)
    console.log('In watcher, extraSearchFilter: ', extraSearchFilter.value)

    searchES()
  }, { deep: true, immediate: true }
)

const parsedGeneralContentHeader = computed(() => {
  return {
    title: generalContentPagesSection.sectionTitle || '',
    summary: generalContentPagesSection.sectionSummary || ''
  }
})

const parsedGeneralContentPages = computed(() => {
  if (generalContentPages.length === 0) return null

  return generalContentPages.map((obj) => {
    return {
      title: obj.title,
      to: `/${obj.uri}`,
      image: obj.ftvaImage[0]
    }
  })
})

const parsedCollectionList = computed(() => {
  if (collectionList.value.length === 0) return []

  return collectionList.value.map((obj) => {
    return {
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
      :section-title="pageTitle"
      class="section-wrapper__page-header"
      theme="paleblue"
      data-test="page-title"
    >
      <RichText :rich-text-content="pageSummary" />
    </SectionWrapper>

    <SectionWrapper
      theme="paleblue"
      class="section-wrapper__divider"
    >
      <DividerWayFinder />
    </SectionWrapper>

    <SectionWrapper
      theme="paleblue"
      class="section-wrapper__collection-list"
    >
      <h2 class="browse-heading">
        Browse by Alphabetical Order
      </h2>
      <AlphabeticalBrowseBy
        class="browse-margin"
        :selected-letter-prop="selectedLetterProp"
        data-test="collection-browse"
        @selected-letter="browseBySelectedLetter"
      />

      <div class="browse-results">
        <h2>{{ hits }} {{ hits > 1 ? `results` : `result` }} shown</h2>
      </div>

      <SectionTeaserCard
        :items="parsedCollectionList"
        data-test="collection-list"
      />

      <SectionPagination
        v-if="totalPages !== 1 && !isMobile"
        :pages="totalPages"
        :initial-current-page="currentPage"
      />
    </SectionWrapper>

    <SectionWrapper
      v-if="parsedGeneralContentPages"
      theme="paleblue"
      class="section-wrapper__general-content"
    >
      <DividerWayFinder />
      <SectionPostSmall
        :items="parsedGeneralContentPages"
        :section-title="parsedGeneralContentHeader.title"
        :section-summary="parsedGeneralContentHeader.summary"
      />
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
.page-collection-type {
  position: relative;
  background-color: var(--pale-blue);

  .section-wrapper__page-header,
  .section-wrapper__divider,
  .section-wrapper__collection-list {
    padding-top: 0;
    padding-bottom: 0;
  }

  .section-wrapper:last-of-type {
    padding-top: 0;
    padding-bottom: 100px;
  }

  .section-wrapper__page-header {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-content: center;
    align-items: center;
    text-align: center;
    max-width: 787px;

    :deep(.section-header) {
      margin-bottom: 24px;
    }

    :deep(.section-title) {
      @include ftva-h4;
      color: $heading-grey;
      font-size: 48px;
      margin-bottom: 0;
    }

    :deep(.parsed-content) {
      margin-bottom: 0;

      p {
        @include ftva-body-2;
        color: $body-grey;
        text-align: left;
      }
    }
  }

  .browse-heading {
    font-size: 16px;
    margin-bottom: 8px;
  }

  .browse-results {
    display: flex;

    h2 {
      display: inline;
      background-color: #132941;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 15px;
      color: #fff;
    }
  }

  :deep(.alphabet-list) {
    max-width: unset;

    .letter {
      text-align: left;
      margin-bottom: 18px;
      padding-left: 0;
    }
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

    .card-meta {
      padding-left: 0;
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

  .section-pagination {
    margin-top: 32px;
  }

  :deep(.section-post-small .grid) {
    max-width: unset;

    .section-header {
      margin-bottom: 32px;
    }
  }
}
</style>
