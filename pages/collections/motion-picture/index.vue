<script setup>

// HELPERS
import _get from 'lodash/get'

import FTVACollectionTypeListing from '../gql/queries/FTVACollectionTypeListing.gql'
import useMobileOnlyInfiniteScroll from '@/composables/useMobileOnlyInfiniteScroll'

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
      uri: route.path,
      sectionHandle: routeNameToSectionMap[route.path]?.sectionName,
      groupName: 'Collections',
      postDate: data.value.entry.postDate,
    }
    // Index the collection type data using the composable during static build
    await indexContent(doc, route.path.replaceAll('/', '--'))
    // console.log('Collection type listing indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX' + route.path + 'during static build:', error)
  }
}

// DATA
const page = ref(_get(data.value, 'entry', {}))
const pageTitle = page.value.title
const generalContentPagesSection = page.value.sectionHeader[0]
const generalContentPages = page.value.associatedGeneralContentPagesFtva

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
  pageTitle.value = page.value.title
  generalContentPagesSection.value = page.value.sectionHeader[0]
  generalContentPages.value = page.value.associatedGeneralContentPagesFtva
})

// PAGE SUMMARY
const showPageSummary = computed(() => {
  return page.value?.summary && page.value?.displaySummary === 'yes'
})

// ELASTIC SEARCH
const hits = ref(0)
const documentsPerPage = 12
const collectionType = ref(routeNameToSectionMap[route.path].collection)

const extraSearchFilter = ref('*')
const selectedLetterProp = ref('')

// "STATE"
const collectionFetchFunction = async (page) => {
  const { paginatedCollectionListQuery } = useCollectionListSearch() // Composable

  const results = await paginatedCollectionListQuery(
    collectionType.value,
    currentPage.value,
    documentsPerPage,
    extraSearchFilter.value
  )
  return results
}

const onResults = (results) => {
  if (results && results.hits && results?.hits?.hits?.length > 0) {
    const newCollectionList = results.hits.hits || []
    hits.value = results.hits.total.value

    if (isMobile.value) {
      totalPages.value = 0
      mobileItemList.value.push(...newCollectionList)
      hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
    } else {
      desktopItemList.value = newCollectionList
      totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)
    }
  } else {
    totalPages.value = 0
    hasMore.value = false
  }
}

// INFINITE SCROLL
const { isLoading, isMobile, hasMore, desktopItemList, mobileItemList, totalPages, currentPage, currentList, scrollElem, searchES } = useMobileOnlyInfiniteScroll(collectionFetchFunction, onResults)

// PAGINATION SCROLL HANDLING
// // Element reference for the scroll target
const resultsSection = ref(null)
// usePaginationScroll composable
const { scrollTo } = usePaginationScroll()

watch(() => route.query, async (newVal, oldVal) => {
  isLoading.value = false
  currentPage.value = route.query.page ? parseInt(route.query.page) : 1
  isMobile.value ? mobileItemList.value = [] : desktopItemList.value = []
  hasMore.value = true

  const filterLetter = route.query.filters

  // filterLetter is general wildcard ('*') or lettered (ex: 'A*')
  if (filterLetter && filterLetter !== '*') {
    selectedLetterProp.value = filterLetter
    extraSearchFilter.value = filterLetter
  } else {
    selectedLetterProp.value = 'All'
    extraSearchFilter.value = '*'
  }

  await searchES()

  await nextTick()
  if (!isMobile.value && route.query.page && resultsSection.value && parsedCollectionList.value.length > 0) {
    await scrollTo(resultsSection)
  }
}, { deep: true, immediate: true })

function browseBySelectedLetter(letter) {
  desktopItemList.value = []
  mobileItemList.value = []

  if (letter !== 'All') {
    extraSearchFilter.value = `${letter}`
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
      to: obj.uri.startsWith('/') ? obj.uri : `/${obj.uri}`,
      image: parseImage(obj)
    }
  })
})

const parsedCollectionList = computed(() => {
  if (currentList.value.length === 0) return []

  return currentList.value.map((obj) => {
    return {
      to: obj._source.to.startsWith('/') ? obj._source.to : `/${obj._source.to}`,
      title: obj._source.title,
      text: obj._source.ftvaHomepageDescription,
      ftvaCollectionType: obj._source.ftvaCollectionType,
      image: parseImage(obj)
    }
  })
})

const pageClass = computed(() => {
  return ['page', 'page-collection-type', route.path.replace('/collections/', '')]
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
    :class="pageClass"
  >
    <div class="one-column">
      <NavBreadcrumb
        data-test="breadcrumb"
        :title="pageTitle"
      />

      <SectionWrapper
        id="collection-section-title"
        ref="scrollElem"
        :section-title="pageTitle"
        class="section-wrapper__page-header"
        theme="paleblue"
        data-test="page-title"
      >
        <template v-if="showPageSummary">
          <RichText
            :rich-text-content="page.summary"
            data-test="page-description"
          />
        </template>
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

        <div
          ref="resultsSection"
          class="browse-results"
        >
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
          :fixed-page-width-mode="true"
          :fixed-page-width-num="10"
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
          :full-width="false"
          :section-title="parsedGeneralContentHeader.title"
          :section-summary="parsedGeneralContentHeader.summary"
        />
      </SectionWrapper>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/listing-pages.scss';

.page-collection-type {
  position: relative;
  background-color: var(--pale-blue);

  .section-wrapper {
    padding-inline: 0;
  }

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
    padding-bottom: 0;

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
      background-color: var(--dark-navy);
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

  :deep(.section-post-small .grid-wrapper) {
    gap: 12px;
  }
}
</style>
