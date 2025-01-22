<script setup>
// COMPONENTS
import { SectionWrapper } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'
import { useWindowSize, useInfiniteScroll } from '@vueuse/core'

// GQL
import FTVAArticleList from '../gql/queries/FTVAArticleList.gql'

// COMPOSABLE
import { useContentIndexer } from '~/composables/useContentIndexer'

const { $graphql } = useNuxtApp()

const route = useRoute()

const { data, error } = await useAsyncData('article-list', async () => {
  const data = await $graphql.default.request(FTVAArticleList)
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entries) {
  // console.log('no data')
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

// This is creating an index of the content for ES search
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the event data using the composable during static build
    await indexContent(data.value.entry, route.params.slug)
    // console.log('Article indexed successfully during static build')
  } catch (error) {
    console.error('FAILED TO INDEX ARTICLES during static build:', error)
  }
}

// DATA
const page = ref(_get(data.value, 'entry', {}))
const pageSummary = page.value.summary
const featuredArticles = page.value.ftvaFeaturedArticles
// const articleList = ref(_get(data.value, 'entries', {}))
// console.log('Data: ', data.value)

// watch(data, (newVal, oldVal) => {
//  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
// })

//
const desktopPage = useState('desktopPage', () => 1) // Persist desktop page
const desktopArticles = ref([]) // Desktop articles list
const mobileArticles = ref([]) // Mobile articles list
const articles = computed(() => (isMobile.value ? mobileArticles.value : desktopArticles.value))

const currentPage = ref(1)
const documentsPerPage = 10
const totalPages = ref(0)

// INFINITE SCROLLING
const isLoading = ref(false)
const isMobile = ref(false)
const hasMore = ref(true) // Flag to control infinite scroll
const scrollEl = ref(null)

const scrollAll = useInfiniteScroll(
  scrollEl,
  async () => {
    if (isMobile.value && hasMore.value && !isLoading.value) {
      currentPage.value++
      await searchES()
    }
  },
  { distance: 100 }
)

// WINDOW SIZE HANDLING
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
    mobileArticles.value = []
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
    desktopArticles.value = []
  }
}

// ES FUNCTION
async function searchES() {
  if (isLoading.value || !hasMore.value) return

  isLoading.value = true

  // COMPOSABLE
  const { paginatedArticlesQuery } = useArticlesListSearch()

  try {
    const results = await paginatedArticlesQuery(
      currentPage.value,
      documentsPerPage,
      'postDate',
      'desc',
      ['*']
    )

    if (results?.hits?.hits?.length > 0) {
      console.log('hits: ', results.hits.hits)
      const newArticles = results.hits.hits || []

      if (isMobile.value) {
        totalPages.value = 0
        mobileArticles.value.push(...newArticles)
        hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
      } else {
        desktopArticles.value = newArticles
        totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)
      }
    } else {
      totalPages.value = 0
      hasMore.value = false
    }
  } catch (err) {
    // console.log(err)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => route.query,
  (newVal, oldVal) => {
    isLoading.value = false
    currentPage.value = route.query.page ? parseInt(route.query.page) : 1
    isMobile.value ? mobileArticles.value = [] : desktopArticles.value = []
    hasMore.value = true
    searchES()
  }, { deep: true, immediate: true }
)

// GET IMAGE
function parsedCarouselImage(obj) {
  return obj._source.imageCarousel
}

function parsedFTVAImage(obj) {
  return obj._source.ftvaImage
}

function isImageExists(obj) {
  // Use FTVA Image
  if (parsedFTVAImage(obj) && parsedFTVAImage(obj).length === 1) {
    return parsedFTVAImage(obj)[0]
  } else if (parsedCarouselImage(obj) && parsedCarouselImage(obj).length >= 1) {
    // Use ImageCarousel
    return parsedCarouselImage(obj)[0]
  } else {
    return null
  }
}

// GET ARTICLE CATEGORIES
function parseArticleCategories(arr) {
  if (arr.length === 0) return null

  return arr.map(obj => obj.title).join(', ')
}

// FORMATTED COMPUTED ARTICLES
const parsedArticles = computed(() => {
  if (articles.value.length === 0) return []

  console.log('articles.value: ', articles.value)
  return articles.value.map((obj) => {
    return {
      ...obj._source,
      to: `/${obj._source.uri}`,
      title: obj._source.title,
      category: parseArticleCategories(obj._source.articleCategories),
      description: obj._source.aboutTheAuthor,
      startDate: obj._source.postDate,
      endDate: obj._source.postDate,
      image: isImageExists(obj)
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
  <div class="page page-article-list">
    <SectionWrapper
      section-title="Archive Blog"
      :section-summary="pageSummary"
      class="header"
      theme="paleblue"
    />

    <div class="dividers">
      <DividerWayFinder />
    </div>

    <SectionWrapper
      section-title="Featured Blogs"
      class="blog-section-title"
      theme="paleblue"
    >
      <!-- <pre>{{ featuredArticles }}</pre> -->
    </SectionWrapper>

    <div class="dividers">
      <DividerWayFinder />
    </div>

    <SectionWrapper
      section-title="Latest Blogs"
      class="blog-section-title"
      theme="paleblue"
    >
      <div class="articles-list-wrapper">
        <SectionStaffArticleList :items="parsedArticles" />

        <SectionPagination
          v-if="totalPages !== 1 && !isMobile"
          :pages="totalPages"
          :initial-current-page="currentPage"
        />
      </div>
    </SectionWrapper>
  </div>
</template>

<style lang="scss" scoped>
@import 'assets/styles/listing-pages.scss';

.page-article-list {
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

  .dividers {
    max-width: var(--ftva-container-max-width);

    .divider-way-finder {
      margin: 0;
    }
  }

  .blog-section-title {
    :deep(.section-header .section-title) {
      font-size: 38px;
      color: #2f2f2f;
    }
  }

  .articles-list-wrapper {
    background-color: var(--color-white);
  }

  .ftva.section-pagination {
    margin-inline: auto;
    padding: 2.5%;
  }

}
</style>
