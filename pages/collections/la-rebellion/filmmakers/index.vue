<script setup>
import { computed } from 'vue'

// HELPERS & UTILS
import _get from 'lodash/get'
import removeTags from '~/utils/removeTags'

// GQL
import FTVALARebellionFilmmakersList from '~/gql/queries/FTVALARebellionFilmmakersList.gql'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('la-rebellion-filmmakers', async () => {
  const data = await $graphql.default.request(FTVALARebellionFilmmakersList)
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

if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()

    const doc = {
      title: data.value.entry.title,
      text: data.value.entry.summary,
      uri: '/collections/la-rebellion/filmmakers/',
      sectionHandle: data.value.entry.sectionHandle,
      groupName: 'Collections',
    }

    // Index the event data using the composable during static build
    await indexContent(doc, 'filmmaker-listing')

    // console.log('Article indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX FILMMAKER LISTING during static build:', error)
  }
}

const page = ref(_get(data.value, 'entry', {}))

watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'entry', {})
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

// "STATE"
const documentsPerPage = 12

const filmmakersFetchFunction = async (page) => {
  const { paginatedFilmmakersQuery } = useFilmmakersListSearch()
  const results = await paginatedFilmmakersQuery(
    page,
    documentsPerPage,
    'title.keyword',
    'asc',
    ['*']
  )
  return results
}

const onResults = (results) => {
  if (results?.hits?.hits?.length > 0) {
    const newListings = results.hits.hits || []

    if (isMobile.value) {
      totalPages.value = 0
      mobileItemList.value.push(...newListings)
      hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
    } else {
      desktopItemList.value = newListings
      totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)
    }
  } else {
    totalPages.value = 0
    hasMore.value = false
  }
}

// INFINITE SCROLL
const { isLoading, isMobile, hasMore, desktopItemList, mobileItemList, totalPages, currentPage, currentList, scrollElem, searchES } = useMobileOnlyInfiniteScroll(filmmakersFetchFunction, onResults)

const route = useRoute()

watch(() => route.query,
  (newVal, oldVal) => {
    isLoading.value = false
    currentPage.value = route.query.page ? parseInt(route.query.page) : 1
    isMobile.value ? mobileItemList.value = [] : desktopItemList.value = []
    hasMore.value = true

    searchES()
  }, { deep: true, immediate: true }
)

// COMPUTED LISTINGS
const parsedFilmmakerListings = computed(() => {
  if (currentList.value.length === 0) return []

  return currentList.value.map((obj) => {
    let filmmakerDescription

    if (!isMobile.value) {
      filmmakerDescription = obj._source.richText
    } else {
      filmmakerDescription = null
    }

    return {
      to: `/${obj._source.to}`,
      title: obj._source.title,
      description: filmmakerDescription,
      image: parseImage(obj),
    }
  })
})

const pageClasses = computed(() => {
  return ['page', 'page-filmmakers']
})

</script>

<template>
  <main
    id="main"
    :class="pageClasses"
  >
    <div class="one-column">
      <NavBreadcrumb data-test="breadcrumb" />

      <SectionWrapper
        ref="scrollElem"
        class="header"
        :section-title="page.title"
        :section-summary="page.summary"
        theme="paleblue"
        data-test="page-heading"
      >
        <SectionStaffArticleList
          :items="parsedFilmmakerListings"
          data-test="page-listings"
        />

        <SectionPagination
          v-if="
            totalPages !== 1 && !isMobile"
          :pages="totalPages"
          :initial-current-page="currentPage"
        />
      </SectionWrapper>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/listing-pages.scss';

.page-filmmakers {
  position: relative;
  background-color: var(--pale-blue);

  .section-wrapper {
    padding-inline: 0;

    :deep(.section-title) {
      @include ftva-h5;
      color: $heading-grey;
    }

    :deep(.section-summary) {
      margin-inline: 0;
      max-width: 100%;
    }
  }

  :deep(.section-pagination) {
    background-color: white;
    padding: 2.5%;
  }

  @media #{$medium} {
    .section-wrapper {
      :deep(div.section-header) {
        margin-bottom: var(--space-xl);
      }
    }
  }
}
</style>
