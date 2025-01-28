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

// "STATE"
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
  searchES()
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

    if (results && results.hits && results?.hits?.hits?.length > 0) {
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
    // eslint-disable-next-line no-console
    console.error('Error fetching data:', error)
    hasMore.value = false
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

// PAGE SUMMARY
const showPageSummary = computed(() => {
  return page.value?.summary && page.value?.displaySummary === 'yes'
})

// PARSED FEATURED ARTICLES
const parsedFeaturedArticles = computed(() => {
  if (featuredArticles.length === 0) {
    return
  }

  return featuredArticles.map((obj) => {
    return {
      image: obj.ftvaImage[0],
      to: obj.uri,
      title: obj.title,
      category: obj.category,
      text: obj.ftvaHomepageDescription,
      dateCreated: obj.postDate
    }
  })
})

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

// PARSED ARTICLE LIST
const parsedArticles = computed(() => {
  if (articles.value.length === 0) return []

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
      ref="scrollElem"
      section-title="Archive Blog"
      class="header"
      theme="paleblue"
      data-test="blog-page-title"
    >
      <template v-if="showPageSummary">
        <RichText :rich-text-content="pageSummary" />
      </template>
    </SectionWrapper>

    <SectionWrapper
      class="dividers"
      theme="paleblue"
    >
      <DividerWayFinder />
    </SectionWrapper>

    <SectionWrapper
      section-title="Featured Blogs"
      class="blog-section-title"
      theme="paleblue"
    >
      <div class="featured-articles-wrapper">
        <BlockCardWithImage
          v-for="article, index in parsedFeaturedArticles"
          :key="article.title"
          :image="article.image"
          :to="article.to"
          :date-created="article.dateCreated"
          :category="article.category"
          class="featured-article"
          :data-test="`featured-blog-${index}`"
        >
          <template #title>
            <RichText :rich-text-content="article.title" />
          </template>
          <template #description>
            <RichText :rich-text-content="article.text" />
          </template>
        </BlockCardWithImage>
      </div>

      <SectionTeaserCard />
    </SectionWrapper>

    <SectionWrapper
      class="dividers"
      theme="paleblue"
    >
      <DividerWayFinder />
    </SectionWrapper>

    <SectionWrapper
      section-title="Latest Blogs"
      class="blog-section-title"
      theme="paleblue"
    >
      <div class="articles-list-wrapper">
        <SectionStaffArticleList
          :items="parsedArticles"
          data-test="latest-blogs"
        />

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

  .header>:deep(.section-header) {
    margin-bottom: 0;
  }

  .dividers {
    padding-block: 0;

    .divider-way-finder {
      margin-block: 0;
    }
  }

  .featured-articles-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr auto;
    row-gap: 2.5rem;
    column-gap: 1.75rem;
  }

  .featured-article {
    background-color: var(--color-white);
  }

  .featured-article:nth-of-type(1) {
    grid-column: 1 / 3;
    grid-row: 1;
  }

  .featured-article:nth-of-type(2) {
    grid-column: 1 / 2;
  }

  .featured-article:nth-of-type(3) {
    grid-column: 2 / 3;
  }

  .featured-article:nth-of-type(2),
  .featured-article:nth-of-type(3) {
    grid-row: 2;
  }

  :deep(.custom-title),
  :deep(.custom-description) {
    .rich-text {
      padding-right: 0;
    }

    .parsed-content {
      margin-bottom: 0;
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

  @media #{$small} {
    .featured-articles-wrapper {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr;
      row-gap: unset;
      column-gap: unset;
    }

    .featured-article:nth-of-type(2),
    .featured-article:nth-of-type(3) {
      display: none;
    }

    .blog-section-title {
      :deep(.section-header .section-title) {
        font-size: 28px;
      }
    }
  }
}
</style>
