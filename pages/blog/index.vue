<script setup>
// HELPERS
import _get from 'lodash/get'
import FTVAArticleList from '../gql/queries/FTVAArticleList.gql'
import useMobileOnlyInfiniteScroll from '@/composables/useMobileOnlyInfiniteScroll'
import usePaginationScroll from '@/composables/usePaginationScroll.ts'

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
      uri: '/blog',
      sectionHandle: data.value.entry.sectionHandle,
      groupName: 'Articles',
      postDate: data.value.entry.postDate,
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
const articleFetchFunction = async (page) => {
  const { paginatedArticlesQuery } = useArticlesListSearch()
  const results = await paginatedArticlesQuery(
    page,
    documentsPerPage,
    'postDate',
    'desc',
    ['*']
  )
  return results
}
const onResults = (results) => {
  if (results && results.hits && results?.hits?.hits?.length > 0) {
    const newArticles = results.hits.hits || []
    const calculatedTotalPages = Math.ceil(results.hits.total.value / documentsPerPage)

    if (isMobile.value) {
      totalPages.value = 0
      mobileItemList.value.push(...newArticles)
      hasMore.value = currentPage.value < calculatedTotalPages
    } else {
      desktopItemList.value = newArticles
      totalPages.value = calculatedTotalPages
    }
  } else {
    console.log('No results found, setting totalPages to 0 and hasMore to false')
    totalPages.value = 0
    hasMore.value = false
  }
}

// INFINITE SCROLL
const documentsPerPage = 10
const { isLoading, isMobile, hasMore, desktopItemList, mobileItemList, totalPages, currentPage, currentList, scrollElem, searchES } = useMobileOnlyInfiniteScroll(articleFetchFunction, onResults)

// PAGINATION SCROLL HANDLING
const { restoreScrollPosition } = usePaginationScroll('blog-section-title')

watch(
  () => route.query,
  (newVal, oldVal) => {
    isLoading.value = false

    currentPage.value = route.query.page ? parseInt(route.query.page) : 1

    // Clear the lists when route changes
    isMobile.value ? mobileItemList.value = [] : desktopItemList.value = []

    hasMore.value = true
    searchES()

    // Restore scroll position
    restoreScrollPosition()
  }, { deep: true, immediate: true }
)

//

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
      image: parseImage(obj),
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
  if (currentList.value === undefined || currentList.value.length === 0) return []
  return currentList.value.map((obj) => {
    return {
      ...obj._source,
      to: `/${obj._source.uri}`,
      title: obj._source.title,
      category: parseArticleCategories(obj._source.articleCategories),
      description: obj._source.aboutTheAuthor,
      date: obj._source.postDate,

      image: parseImage(obj),
      sectionHandle: obj._source.sectionHandle,
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
      <SectionHeader
        id="blog-section-title"
        :level="3"
      >
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
    margin-block: 0;

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

  :deep(.ftva.block-staff-article-item:last-child .date) {
    height: auto;
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
