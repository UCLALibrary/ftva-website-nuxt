<script setup>
// HELPERS
import _get from 'lodash/get'
import { useWindowSize, useInfiniteScroll } from '@vueuse/core'
import FTVAArticleList from '../gql/queries/FTVAArticleList.gql'
import useMobileOnlyInfiniteScroll from '@/composables/useMobileOnlyInfiniteScroll'

// GQL

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
      uri: '/blog'
    }
    // Index the articles data using the composable during static build
    await indexContent(doc, 'article-listing')
    // console.log('Articles indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX EVENT ARTICLE LISTING during static build:', error)
  }
}

// DATA
const page = ref(_get(data.value, 'entry', {}))
const pageTitle = page.value.title
const pageSummary = page.value.summary
const featuredArticles = page.value.ftvaFeaturedArticles

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'entry', {})
  pageTitle.value = page.value.title
  pageSummary.value = page.value.summary
  featuredArticles.value = page.value.ftvaFeaturedArticles
})

// "STATE"
// replaced by 'useMobileOnlyInfiniteScroll' composable
const { localState, currentList, scrollElem, updateValues, reset } = await useMobileOnlyInfiniteScroll(searchES)
// const desktopPage = useState('desktopPage', () => 1) // Persist desktop page
// const desktopArticles = ref([]) // Desktop articles list
// const mobileArticles = ref([]) // Mobile articles list
// const articles = computed(() => (isMobile.value ? mobileArticles.value : desktopArticles.value))
// TODO 'articles' becomes 'currentList'
// const currentPage = ref(1)

const documentsPerPage = 10
const totalPages = ref(0)

// INFINITE SCROLLING
// const isLoading = ref(false)
// const isMobile = ref(false)
// const hasMore = ref(true) // Flag to control infinite scroll

// const scrollElem = ref(null)
// const { reset } = useInfiniteScroll(
//   scrollElem,
//   async () => {
//     if (isMobile.value && hasMore.value && !isLoading.value) {
//       currentPage.value++
//       await searchES()
//     }
//   },
//   { distance: 100 }
// )

// HANDLE WINDOW SIZING
// const { width } = useWindowSize()
// watch(width, (newWidth) => {
//   const wasMobile = isMobile.value

//   isMobile.value = newWidth <= 750
//   // Reinitialize only when transitioning between mobile and desktop
//   if (wasMobile !== isMobile.value) {
//     handleScreenTransition()
//   }
// }, { immediate: true })

// HANDLE SCREEN TRANSITIONS
// function handleScreenTransition() {
//   if (isMobile.value) {
//     // Switching to mobile: save desktop page, clear query param

//     desktopPage.value = currentPage.value
//     currentPage.value = 1
//     mobileArticles.value = []
//     hasMore.value = true
//     const { page, ...remainingQuery } = route.query
//     useRouter().push({ query: { ...remainingQuery } })
//   } else {
//     // Switching to desktop: restore query param
//     if (totalPages.value === 1)
//       desktopPage.value = 1
//     const restoredPage = desktopPage.value || 1
//     useRouter().push({ query: { ...route.query, page: restoredPage.toString() } })
//     currentPage.value = restoredPage
//     desktopArticles.value = []
//   }
//   searchES()
// }

// ELASTIC SEARCH
async function searchES() {
  if (localState.isLoading || !localState.hasMore) return

  updateValues({
    isLoading: true
  })
  // isLoading.value = true

  // COMPOSABLE
  const { lesQuery } = useArticlesListSearch()

  try {
    const results = await paginatedArticlesQuery(
      1, // TODO renable when fix is found localState.currentPage,
      documentsPerPage,
      'postDate',
      'desc',
      ['*']
    )

    if (results && results.hits && results?.hits?.hits?.length > 0) {
      console.log('results', results)
      const newArticles = results.hits.hits || []

      if (localState.isMobile) {
        totalPages.value = 0
        updateValues({
          currentList: [...localState.currentList, ...newArticles],
          hasMore: localState.currentPage < Math.ceil(results.hits.total.value / documentsPerPage)
        })
        // currentList.value.push(...newArticles)
        // hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
      } else {
        // desktopArticles.value = newArticles
        console.log('desktopArticles', newArticles)
        updateValues({
          desktopItemList: [...newArticles],
        })
        // TODO TODO never gets here, never logs
        console.log('desktopItemList', desktopItemList)
        // currentList.value = newArticles
        totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)
      }
    } else {
      totalPages.value = 0
      updateValues({
        hasMore: false
      })
      // hasMore.value = false
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching data:', error)
    updateValues({
      hasMore: false
    })
    // hasMore.value = false
  } finally {
    updateValues({
      isLoading: false
    })
    // isLoading.value = false
  }
}

watch(
  () => route.query,
  (newVal, oldVal) => {
    console.log('In watch route query', newVal, oldVal)
    updateValues({
      isLoading: false
    })
    // isLoading.value = false
    // TODO this line is causing an error
    localState.currentPage = route.query.page ? parseInt(route.query.page) : 1

    localState.isMobile ? updateValues({ mobileItemList: [] }) : updateValues({ desktopItemList: [] })
    updateValues({
      hasMore: true
    })
    // hasMore.value = true
    console.log('about to searchES')
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
    const parsedTitle = parseRichTextTitle(obj)

    return {
      image: obj.image[0],
      to: `/${obj.uri}`,
      title: parsedTitle,
      category: parseArticleCategories(obj.articleCategories),
      text: obj.ftvaHomepageDescription,
      dateCreated: obj.postDate
    }
  })
})

// PARSED ARTICLE LIST
const parsedArticles = computed(() => {
  console.log('parsing articles', localState.currentList)
  if (localState.currentList === undefined || localState.currentList.length === 0) return []
  return localState.currentList.map((obj) => {
    return {
      ...obj._source,
      to: `/${obj._source.uri}`,
      title: obj._source.title,
      category: parseArticleCategories(obj._source.articleCategories),
      description: obj._source.aboutTheAuthor,
      startDate: obj._source.postDate,
      endDate: obj._source.postDate,
      image: parseImage(obj)
    }
  })
})

// GET FEATURED ARTICLES RICH TEXT TITLE
function parseRichTextTitle(obj) {
  return !obj.ftvaAlternativeTitle ? obj.title : obj.ftvaAlternativeTitle
}

// GET ARTICLE CATEGORIES
function parseArticleCategories(arr) {
  if (arr.length === 0) return
  return arr.map(obj => obj.title).join(', ')
}

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
      :section-title="pageTitle"
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
      class="blog-section-title"
      theme="paleblue"
      :level="3"
    >
      <SectionHeader :level="3">
        {{ isMobile ? 'Featured Blog' : 'Featured Blogs' }}
      </SectionHeader>

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
          <template #customTitle>
            <RichText :rich-text-content="article.title" />
          </template>

          <template #customDescription>
            <RichText :rich-text-content="article.text" />
          </template>
        </BlockCardWithImage>
      </div>
    </SectionWrapper>

    <SectionWrapper
      class="dividers"
      theme="paleblue"
    >
      <DividerWayFinder />
    </SectionWrapper>

    <SectionWrapper
      class="blog-section-title"
      theme="paleblue"
      :level="3"
    >
      <SectionHeader :level="3">
        Latest Blogs
      </SectionHeader>

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
    margin-top: 20px;
    margin-bottom: 0px;

    h2.section-title {
      color: $heading-grey;
    }
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

  :deep(.ftva.block-highlight.is-vertical:nth-of-type(1) .image-container),
  :deep(.ftva.block-highlight.is-vertical:nth-of-type(1) .image) {
    max-height: 400px;
  }

  :deep(.ftva.block-highlight.is-vertical .image-container),
  :deep(.ftva.block-highlight .image) {
    max-height: 330px;
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
    :deep(.section-header) {
      font-size: 38px;
      margin-bottom: 48px;
      color: $heading-grey;
    }
  }

  .articles-list-wrapper {
    background-color: var(--color-white);
    margin-bottom: 20px;
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
      :deep(.section-header) {
        font-size: 28px;
        margin-bottom: 16px;
      }
    }
  }

  /* Fix image sizing of cards on all viewports */

  @media (max-width: 749px) {

    :deep(.ftva.block-highlight.is-vertical:nth-of-type(1) .image-container),
    :deep(.ftva.block-highlight.is-vertical:nth-of-type(1) .image),
    :deep(.ftva.block-staff-article-item .image),
    :deep(.block-staff-article-item .molecule-no-image) {
      min-width: 100%;
      height: 255px;
    }
  }

  @media (min-width: 750px) {
    :deep(.ftva.block-highlight.is-vertical > .card-meta) {
      .category {
        margin-bottom: 12px;
      }

      .byline-group {
        position: relative;
        margin: 0;
      }
    }

    :deep(.ftva.block-highlight.is-vertical:nth-of-type(1) > .card-meta) {
      padding: 48px 48px 32px;

      .custom-title .rich-text div {
        font-size: 48px;
        font-weight: 700;
      }
    }

    :deep(.ftva.block-highlight.is-vertical:nth-of-type(2) > .card-meta),
    :deep(.ftva.block-highlight.is-vertical:nth-of-type(3) > .card-meta) {
      padding: 36px 36px 24px;

      .custom-title .rich-text div {
        font-size: 30px;
        font-weight: 500;
      }
    }

    :deep(.ftva.block-staff-article-item .image),
    :deep(.block-staff-article-item .molecule-no-image) {
      min-width: 284px;
      height: 213px;
    }
  }

  @media (min-width: 1000px) {

    :deep(.ftva.block-staff-article-item .image),
    :deep(.block-staff-article-item .molecule-no-image) {
      min-width: 400px;
      height: 300px;
    }
  }
}
</style>
